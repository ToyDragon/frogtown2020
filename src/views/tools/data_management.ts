import Services from "../../server/services";
import { DataInfoResponse } from "./types";
import { DataFileRow } from "../../server/database/db_manager";
import { logInfo } from "../../server/log";
import { dateToMySQL } from "../../shared/utils";
import * as https from "https";

const allDataKey = "AllData.json";

let downloadInProgress = false;
let downloadCurBytes = 0;
let downloadMaxBytes = 0;

interface BulkDataListing {
  data: {
    type: string;
    updated_at: string;
    download_uri: string;
    compressed_size: number;
  }[];
}

export async function getDataInfo(
  services: Services
): Promise<DataInfoResponse | null> {
  const result = {
    allCardsChangeDate: "",
    allCardsNextChangeDate: "",
    allCardsUpdateDate: "",
    dataMapsUpdateDate: "",
    allCardsUpdateInProgress: downloadInProgress,
  };

  const bulkdataResponse = await services.scryfallManager.request<
    BulkDataListing
  >("https://api.scryfall.com/bulk-data");
  if (bulkdataResponse && bulkdataResponse.data) {
    for (const group of bulkdataResponse.data) {
      if (group.type === "all_cards") {
        result.allCardsNextChangeDate = group.updated_at;
      }
    }
  }

  const connection = await services.dbManager.getConnection();
  if (connection) {
    const allDataRows = await connection.query<DataFileRow[]>(
      "SELECT * FROM data_files WHERE name=?;",
      ["all_files"]
    );
    if (allDataRows.value && allDataRows.value.length === 1) {
      result.allCardsChangeDate = allDataRows.value[0].change_time + " UTC";
      result.allCardsUpdateDate = allDataRows.value[0].update_time + " UTC";
    }
  }

  return result;
}

export async function getAllCardsFileProgress(
  _services: Services
): Promise<number> {
  if (!downloadInProgress) {
    return 1.0;
  }
  return downloadCurBytes / downloadMaxBytes;
}

export async function startDownloadNewAllCardsFile(
  services: Services
): Promise<void> {
  // TODO lock the data_files table while doing this.
  if (downloadInProgress) {
    return;
  }
  downloadInProgress = true;

  let data_url = "";
  let data_changed = "";
  const bulkdataResponse = await services.scryfallManager.request<
    BulkDataListing
  >("https://api.scryfall.com/bulk-data");
  if (bulkdataResponse && bulkdataResponse.data) {
    for (const group of bulkdataResponse.data) {
      if (group.type === "all_cards") {
        data_changed = group.updated_at;
        data_url = group.download_uri;
        // Expect a compression ratio of 1 : 6.3. This is not ideal, but I don't know how to get either:
        // 1. The uncompressed size of request
        // 2. The compressed size of the incoming data
        // Without either of those, best we can do is guess.
        downloadMaxBytes = group.compressed_size * 6.3;
      }
    }
  }

  const awsStream = services.storagePortal.uploadStreamToBucket(
    services.config.storage.awsS3DataMapBucket,
    allDataKey
  );

  downloadCurBytes = 0;
  https.get(data_url, (msg) => {
    msg.pipe(awsStream);
    msg.on("data", (chunk: { length: number }) => {
      if (chunk && chunk.length) {
        downloadCurBytes += chunk.length;
      }
    });
    msg.on("close", async () => {
      logInfo("Done at: " + downloadCurBytes + " / " + downloadMaxBytes);
      downloadCurBytes = downloadMaxBytes;
      downloadInProgress = false;
      const connection = await services.dbManager.getConnection();
      if (connection) {
        const insertResult = await connection.query(
          "REPLACE INTO data_files (name, update_time, change_time) VALUES (?, ?, ?);",
          [
            "all_files",
            dateToMySQL(new Date()),
            dateToMySQL(new Date(data_changed)),
          ]
        );
        logInfo("Insert result: " + JSON.stringify(insertResult));
      }
    });
  });
}

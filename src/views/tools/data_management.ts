import Services from "../../server/services";
import { DataInfoResponse } from "./types";
import { logInfo } from "../../server/log";
import { dateToMySQL } from "../../shared/utils";
import * as https from "https";
import {
  constructAllMaps,
  getConstructionProgress,
} from "./mapconstruction/construct_all_maps";
import { DataFilesRow } from "../../server/database/dbinfos/db_info_data_files";
import { endBatch, trySetBatchInProgress } from "./batch_status";
import { BatchStatusRow } from "../../server/database/dbinfos/db_info_batch_status";
import { DatabaseConnection } from "../../server/database/db_connection";

const allDataKey = "AllData.json";

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
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return null;
  }
  const result = {
    allCardsChangeDate: "",
    allCardsNextChangeDate: "",
    allCardsUpdateDate: "",
    dataMapsUpdateDate: "",
    dataMapsChangeDate: "",
    allCardsS3Date: "",
    allCardsUpdateInProgress: await getDownloadInProgress(connection),
    dataMapsUpdateInProgress:
      (await getConstructionProgress(services)) !== null,
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

  result.allCardsS3Date = await services.storagePortal.getObjectChangedDate(
    services.config.storage.awsS3DataMapBucket,
    allDataKey
  );

  const allDataRows = await connection.query<DataFilesRow[]>(
    "SELECT * FROM data_files;",
    []
  );
  if (allDataRows.value) {
    for (const row of allDataRows.value) {
      if (row.name === "all_cards") {
        result.allCardsChangeDate = row.change_time + " UTC";
        result.allCardsUpdateDate = row.update_time + " UTC";
      }
      if (row.name === "map_files") {
        result.dataMapsChangeDate = row.change_time + " UTC";
        result.dataMapsUpdateDate = row.update_time + " UTC";
      }
    }
  }
  connection.release();
  return result;
}

async function getDownloadInProgress(
  connection: DatabaseConnection
): Promise<boolean> {
  const result = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["all_cards_download_in_progress"]
  );
  return (
    (result?.value && result?.value?.length > 0 && result?.value![0].value) ===
    "true"
  );
}

export async function getAllCardsFileProgress(
  services: Services
): Promise<number> {
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return 0;
  }

  const result = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["all_cards_download_progress"]
  );

  connection.release();
  return (
    Number(
      result?.value && result?.value?.length > 0 && result?.value![0].value
    ) || 0
  );
}

export async function getMapConstructionProgress(
  services: Services
): Promise<number | null> {
  return await getConstructionProgress(services);
}

export async function startConstructingDataMaps(
  services: Services
): Promise<void> {
  const connection = await services.dbManager.getConnectionTimeout(
    15 * 60 * 1000 //15 minute timeout
  );
  if (!connection) {
    return;
  }
  if (!(await trySetBatchInProgress(connection))) {
    connection.release();
    return;
  }
  const allDataRows = await connection.query<DataFilesRow[]>(
    "SELECT * FROM data_files WHERE name=?;",
    ["all_cards"]
  );

  if (allDataRows.value && allDataRows.value.length === 1) {
    const change_time = allDataRows.value[0].change_time;
    const performed = await constructAllMaps(connection, services);
    if (performed) {
      const insertResult = await connection.query(
        "REPLACE INTO data_files (name, update_time, change_time) VALUES (?, ?, ?);",
        [
          "map_files",
          dateToMySQL(new Date()),
          dateToMySQL(new Date(change_time)),
        ]
      );
      logInfo("Insert result: " + JSON.stringify(insertResult));
    }
  }
  endBatch(connection);
  connection.release();
}

export async function startDownloadNewAllCardsFile(
  services: Services
): Promise<void> {
  const connection = await services.dbManager.getConnectionTimeout(
    30 * 60 * 1000 // 30 minute timeout
  );
  if (!connection) {
    return;
  }
  if (!(await trySetBatchInProgress(connection))) {
    connection.release();
    return;
  }
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

  let lastUpdate = 0;
  const MB = 1000000;
  downloadCurBytes = 0;

  await connection.query(
    "REPLACE INTO batch_status (name, value) VALUES(?, ?), (?, ?);",
    [
      "all_cards_download_progress",
      "0",
      "all_cards_download_in_progress",
      "true",
    ]
  );

  logInfo("Starting all cards file update.");
  https.get(data_url, (msg) => {
    msg.on("data", (chunk: { length: number }) => {
      if (chunk && chunk.length) {
        downloadCurBytes += chunk.length;
        if (downloadCurBytes - lastUpdate > 2 * MB) {
          lastUpdate = downloadCurBytes;
          //Update the database every 2MB
          connection.query(
            "REPLACE INTO batch_status (name, value) VALUES(?, ?);",
            ["all_cards_download_progress", downloadCurBytes / downloadMaxBytes]
          );
        }
      }
    });
    msg.pipe(awsStream);
    msg.on("close", async () => {
      logInfo("Done at: " + downloadCurBytes + " / " + downloadMaxBytes);
      downloadCurBytes = downloadMaxBytes;
      awsStream.end();
      await connection.query(
        "REPLACE INTO batch_status (name, value) VALUES(?, ?), (?, ?);",
        [
          "all_cards_download_progress",
          downloadCurBytes / downloadMaxBytes,
          "all_cards_download_in_progress",
          "false",
        ]
      );
      const insertResult = await connection.query(
        "REPLACE INTO data_files (name, update_time, change_time) VALUES (?, ?, ?);",
        [
          "all_cards",
          dateToMySQL(new Date()),
          dateToMySQL(new Date(data_changed)),
        ]
      );
      logInfo("Insert result: " + JSON.stringify(insertResult));
      await endBatch(connection);
      connection.release();
    });
  });
}

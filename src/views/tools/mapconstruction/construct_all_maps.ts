import Services from "../../../server/services";
import IndividualMapConstructor from "./individual_map_constructor";
import { logInfo, logError } from "../../../server/log";
import { BatchStatusRow } from "../../../server/database/dbinfos/db_info_batch_status";
import { DatabaseConnection } from "../../../server/database/db_connection";

let constructors: IndividualMapConstructor[] = [];

export function constructAllMaps(
  connection: DatabaseConnection,
  services: Services
): Promise<boolean> {
  return new Promise((resolve) => {
    (async () => {
      await connection.query(
        "REPLACE INTO batch_status (name, value) VALUES(?, ?), (?, ?);",
        ["construct_maps_progress", "0", "construct_maps_in_progress", "true"]
      );

      let aborted = false;
      constructors = [];
      for (const mapFile of services.config.mapFiles) {
        constructors.push(
          new IndividualMapConstructor(
            (await services.file.readFile(mapFile)) || ""
          )
        );
      }

      const allCardsURL =
        services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/AllData.json";

      logInfo("Stream all card data to constructors...");
      let lastUpdate = 0;
      let totalChars = 0;
      const getResult = await services.net.httpsGet(allCardsURL);
      for (const ctor of constructors) {
        ctor.attachStream(getResult.stream);
      }
      getResult.stream.on("data", (data: string) => {
        totalChars += data.length;
        if (totalChars - lastUpdate > 5000000) {
          lastUpdate = totalChars;
          let cardCount = 0;
          let errorCount = 0;
          for (const ctor of constructors) {
            cardCount += ctor.getCardCount();
            errorCount += ctor.errorCount;
          }
          connection.query(
            "REPLACE INTO batch_status (name, value) VALUES(?, ?);",
            ["construct_maps_progress", cardCount]
          );
          logInfo("Map progress: " + cardCount);

          if (errorCount > 20) {
            aborted = true;
            logError("Aborting data map build, errors occurred: " + errorCount);
            getResult.stop();
          }
        }
      });
      getResult.stream.on("close", async () => {
        if (aborted) {
          resolve(false);
          console.log("aborted");
          return;
        }
        for (const ctor of constructors) {
          if (
            !ctor.mapTemplate ||
            !ctor.mapTemplate.data ||
            !ctor.mapTemplate.data.maps
          ) {
            continue;
          }

          for (let i = 0; i < ctor.mapTemplate.data.maps.length; i++) {
            const mapTemplate = ctor.mapTemplate.data.maps[i];
            const mapData = JSON.stringify(ctor.mapTemplate.mapData[i]);
            logInfo("Saving " + mapTemplate.name + ".json");
            await services.storagePortal.uploadStringToBucket(
              services.config.storage.awsS3DataMapBucket,
              mapTemplate.name + ".json",
              mapData
            );
          }
        }

        await connection.query(
          "REPLACE INTO batch_status (name, value) VALUES(?, ?), (?, ?);",
          [
            "construct_maps_progress",
            "0",
            "construct_maps_in_progress",
            "false",
          ]
        );
        resolve(true);
      });
    })();
  });
}

export async function getConstructionProgress(
  services: Services
): Promise<number | null> {
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return null;
  }
  let result = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["construct_maps_in_progress"]
  );
  if (
    !result?.value ||
    result?.value.length === 0 ||
    result?.value[0].value !== "true"
  ) {
    connection.release();
    return null;
  }

  result = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["construct_maps_progress"]
  );
  if (!result?.value || result?.value.length === 0) {
    connection.release();
    return null;
  }

  connection.release();
  return Number(result?.value[0].value);
}

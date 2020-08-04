import Services from "../../../server/services";
import IndividualMapConstructor from "./individual_map_constructor";
import * as https from "https";
import { logInfo } from "../../../server/log";

let mapConstructionInProgress = false;
let constructors: IndividualMapConstructor[] = [];

export function constructAllMaps(services: Services): Promise<boolean> {
  return new Promise((resolve) => {
    if (mapConstructionInProgress) {
      resolve(false);
      return;
    }

    mapConstructionInProgress = true;
    constructors = [];
    for (const mapFile of services.config.mapFiles) {
      constructors.push(new IndividualMapConstructor(mapFile));
    }

    const allCardsURL =
      services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/AllData.json";

    logInfo("Stream all card data to constructors...");
    https.get(allCardsURL, (stream) => {
      for (const ctor of constructors) {
        ctor.attachStream(stream);
      }
      stream.on("close", async () => {
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
        mapConstructionInProgress = false;
        resolve(true);
      });
    });
  });
}

export function getConstructionProgress(): number | null {
  if (!constructors || !mapConstructionInProgress) {
    return null;
  }

  let count = 0;
  for (const ctor of constructors) {
    count += ctor.getCardCount();
  }
  return count;
}

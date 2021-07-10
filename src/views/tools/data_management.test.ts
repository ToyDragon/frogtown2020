import { Clock } from "../../server/clock";
import Config from "../../server/config";
import initializeDatabase from "../../server/database/initialize_database";
import MemoryDatabaseManager from "../../server/database/memory_db_manager";
import MemoryLocalStorage from "../../server/local_storage/memory_local_storage";
import { Level, setLogLevel } from "../../server/log";
import MemoryNetworkManager from "../../server/memory_network_manager";
import { PerformanceMonitor } from "../../server/performance_monitor/performance_monitor";
import MemoryScryfallManager from "../../server/scryfall_manager/memory_scryfall_manager";
import Services from "../../server/services";
import MemoryStoragePortal from "../../server/storage_portal_memory";
import { timeout } from "../../shared/utils";
import {
  getAllCardsFileProgress,
  getDataInfo,
  startConstructingDataMaps,
  startDownloadNewAllCardsFile,
} from "../../views/tools/data_management";

// This test verifies that the AllCards file is retrieved from Scryfall, and stored in the blog storage.
test("Downloads all cards, and can construct maps.", async () => {
  setLogLevel(Level.NONE);
  const allCardsData = JSON.stringify([
    /* eslint-disable max-len */
    /* eslint-disable prettier/prettier */
    {"object":"card","id":"10001111-2222-3333-4444-555566667777","oracle_id":"10003333-4444-5555-6666-777788889999","multiverse_ids":[1],"name":"Kanye West","lang":"en"},
    {"object":"card","id":"20001111-2222-3333-4444-555566667777","oracle_id":"20003333-4444-5555-6666-777788889999","multiverse_ids":[2],"name":"Kanye North","lang":"en"},
    {"object":"card","id":"30001111-2222-3333-4444-555566667777","oracle_id":"30003333-4444-5555-6666-777788889999","multiverse_ids":[3],"name":"Kanye East","lang":"en"},
    {"object":"card","id":"40001111-2222-3333-4444-555566667777","oracle_id":"40003333-4444-5555-6666-777788889999","multiverse_ids":[4],"name":"Kanye South","lang":"en"},
    {"object":"card","id":"50001111-2222-3333-4444-555566667777","oracle_id":"50003333-4444-5555-6666-777788889999","multiverse_ids":[5],"name":"Kanye !@#)!@(#","lang":"hieroglyphics"},
    /* eslint-enable max-len */
    /* eslint-disable prettier/prettier */
  ]);
  const clock: Clock = {
    now: () => {
      return new Date("2021-01-01T05:00:00");
    },
  };
  const services: Services = {
    config: new Config(),
    dbManager: new MemoryDatabaseManager(),
    file: new MemoryLocalStorage({
      "/fake/mapfile/map1.json": JSON.stringify({
        filter: [
            {
                key: "lang",
                operator: "equals",
                value: "en"
            }
        ],
        maps: [
            {
                name: "IDToName",
                duplicates: false,
                key: "id",
                value: "name"
            },
            {
                name: "NameToID",
                duplicates: true,
                key: "name",
                value: "id"
            }
        ]
      }),
    }),
    perfMon: new PerformanceMonitor(),
    storagePortal: new MemoryStoragePortal(clock),
    scryfallManager: new MemoryScryfallManager({
      "https://api.scryfall.com/bulk-data": JSON.stringify({
        object: "list",
        has_more: false,
        data: [
          {
            object: "bulk_data",
            id: "abcdefg",
            type: "all_cards",
            updated_at: "2021-07-07T22:07:49.712+00:00",
            uri: "https://api.scryfall.com/bulk-data/abcdefg",
            name: "All Cards",
            description: "A JSON file with some stuff.",
            compressed_size: allCardsData.length / 6.3, // Divide by 6.3 to counteract the expected compression.
            download_uri: "https://c2.scryfall.com/all-cards-abcdefg.json",
            content_type: "application/json",
            content_encoding: "gzip",
          },
        ],
      }),
      "https://c2.scryfall.com/all-cards-abcdefg.json": allCardsData,
    }, {}),
    clock: clock,
    net: new MemoryNetworkManager({
      "https://www.infinitestorage.fake/bucket_name/AllData.json": allCardsData,
    }),
  };
  services.config.storage.externalRoot = "https://www.infinitestorage.fake";
  services.config.storage.awsS3DataMapBucket = "bucket_name";
  services.config.mapFiles = ["/fake/mapfile/map1.json"];
  await initializeDatabase(services.dbManager, new Config());

  // Get the data info, before any updates have been made.
  let dataInfo = await getDataInfo(services);
  expect(dataInfo).not.toBeNull();
  if (dataInfo === null){
    return;
  }

  // Verify the change/update dates are all empty, because no updates have been completed yet.
  expect(dataInfo.allCardsChangeDate).toBe("");
  expect(dataInfo.allCardsUpdateDate).toBe("");
  expect(dataInfo.dataMapsChangeDate).toBe("");
  expect(dataInfo.dataMapsUpdateDate).toBe("");

  // Verify that the next change date was pulled from the bulk data listing.
  expect(dataInfo.allCardsNextChangeDate).toBe("2021-07-07T22:07:49.712+00:00");

  // Verify that the AllCards file and data maps related properties are empty.
  expect(dataInfo.allCardsS3Date).toBe("");
  expect(dataInfo.allCardsUpdateInProgress).toBe(false);
  expect(dataInfo.dataMapsUpdateInProgress).toBe(false);
  expect(await getAllCardsFileProgress(services)).toBe(0);

  // Download the all cards file to the S3 bucket.
  await startDownloadNewAllCardsFile(services);
  await timeout(100);
  dataInfo = await getDataInfo(services);
  expect(dataInfo).not.toBeNull();
  if (dataInfo === null){
    return;
  }

  // Verify that the all cards related dates match the current time, and the time rom the bulk data.
  expect(dataInfo.allCardsChangeDate).toBe("2021-07-07 22:07:49 UTC");
  expect(dataInfo.allCardsUpdateDate).toBe("2021-01-01 11:00:00 UTC");

  // Verify that the data map related dates are still empty.
  expect(dataInfo.dataMapsChangeDate).toBe("");
  expect(dataInfo.dataMapsUpdateDate).toBe("");

  // Verify that the next change date was pulled from the bulk data listing.
  expect(dataInfo.allCardsNextChangeDate).toBe("2021-07-07T22:07:49.712+00:00");

  // Verify that the AllCards file and data maps related properties are empty.
  expect(dataInfo.allCardsS3Date).toBe("Fri Jan 01 2021 05:00:00 GMT-0600 (Central Standard Time)");
  expect(dataInfo.allCardsUpdateInProgress).toBe(false);
  expect(dataInfo.dataMapsUpdateInProgress).toBe(false);

  // Construct the data maps.
  await startConstructingDataMaps(services);
  await timeout(200);
  dataInfo = await getDataInfo(services);
  expect(dataInfo).not.toBeNull();
  if (dataInfo === null){
    return;
  }

  // Verify that the data map related dates are still empty.
  expect(dataInfo.dataMapsChangeDate).toBe("2021-07-08 03:07:49 UTC");
  expect(dataInfo.dataMapsUpdateDate).toBe("2021-01-01 11:00:00 UTC");

  // Verify that the IDToName map contains the expected data.
  const IDToName = JSON.parse(await services.storagePortal.getObjectAsString("bucket_name", "IDToName.json"));
  expect(IDToName["10001111-2222-3333-4444-555566667777"]).toBe("Kanye West");
  expect(IDToName["20001111-2222-3333-4444-555566667777"]).toBe("Kanye North");
  expect(IDToName["30001111-2222-3333-4444-555566667777"]).toBe("Kanye East");
  expect(IDToName["40001111-2222-3333-4444-555566667777"]).toBe("Kanye South");
  expect(typeof IDToName["50001111-2222-3333-4444-555566667777"]).toBe("undefined");

  // Verify that the NameToID map contains the expected data.
  const NameToID = JSON.parse(await services.storagePortal.getObjectAsString("bucket_name", "NameToID.json"));
  expect(NameToID["Kanye West"][0]).toBe("10001111-2222-3333-4444-555566667777");
  expect(NameToID["Kanye North"][0]).toBe("20001111-2222-3333-4444-555566667777");
  expect(NameToID["Kanye East"][0]).toBe("30001111-2222-3333-4444-555566667777");
  expect(NameToID["Kanye South"][0]).toBe("40001111-2222-3333-4444-555566667777");
});

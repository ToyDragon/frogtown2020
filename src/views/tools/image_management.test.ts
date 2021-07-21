import * as fs from "fs";
import { Clock } from "../../server/services/clock";
import Config from "../../server/services/config/config";
import initializeDatabase from "../../server/services/database/initialize_database";
import MemoryDatabaseManager from "../../server/services/database/memory_db_manager";
import MemoryLocalStorage from "../../server/services/local_storage/memory_local_storage";
import { Level, setLogLevel } from "../../server/log";
import MemoryNetworkManager from "../../server/services/network_manager/memory_network_manager";
import { PerformanceMonitor } from "../../server/services/performance_monitor/performance_monitor";
import MemoryScryfallManager from "../../server/services/scryfall_manager/memory_scryfall_manager";
import Services from "../../server/services";
import MemoryStoragePortal from "../../server/services/storage_portal/storage_portal_memory";
import { dateToMySQL, timeout } from "../../shared/utils";
import { getAllImageInfos, startUpdatingImages } from "./image_management";
import { ImageInfo } from "./types";

// TODO: test CYMK file conversion.
//
// This test verifies that Card images can be downloaded, resized, and stored in S3.
test("Downloads card images, resizes, and stores them.", async () => {
  setLogLevel(Level.NONE);

  const config = new Config();
  config.storage.externalRoot = "https://www.infinitestorage.fake";
  config.storage.awsS3DataMapBucket = "bucket_name";
  config.storage.awsS3FullQualityImageBucket = "fq";
  config.storage.awsS3HighQualityImageBucket = "hq";
  config.storage.awsS3CompressedImageBucket = "lq";
  const blobPrefix = `${config.storage.externalRoot}/${config.storage.awsS3DataMapBucket}/`;
  const jsonFiles: Record<string, string> = {};

  /* eslint-disable prettier/prettier */
  jsonFiles[`${blobPrefix}IDToLargeImageURI.json`]      = JSON.stringify({ "1": "https://www.scryfly.fake/Images/1.jpg" });
  jsonFiles[`${blobPrefix}TokenIDToLargeImageURI.json`] = JSON.stringify({ "2": "https://www.scryfly.fake/Images/2.jpg" });
  jsonFiles[`${blobPrefix}BackIDToLargeImageURI.json`]  = JSON.stringify({ "3": "https://www.scryfly.fake/Images/3.jpg", "4": "https://neverused" });
  jsonFiles[`${blobPrefix}IDToHasHighRes.json`]         = JSON.stringify({ "1": false });
  jsonFiles[`${blobPrefix}TokenIDToHasHighRes.json`]    = JSON.stringify({ "2": true });
  jsonFiles[`${blobPrefix}BackIDToHasHighRes.json`]     = JSON.stringify({ "3": true, "4": false });
  /* eslint-enable prettier/prettier */

  const clock: Clock = {
    now: () => {
      return new Date("2021-01-01T05:00:00");
    },
  };
  const services: Services = {
    config: config,
    dbManager: new MemoryDatabaseManager(),
    file: new MemoryLocalStorage({}),
    perfMon: new PerformanceMonitor(),
    storagePortal: new MemoryStoragePortal(clock),
    scryfallManager: new MemoryScryfallManager(
      {},
      {
        /* eslint-disable prettier/prettier */
        "https://www.scryfly.fake/Images/1.jpg": () => fs.createReadStream("./test_data_files/fireball.jpg"),
        "https://www.scryfly.fake/Images/2.jpg": () => fs.createReadStream("./test_data_files/fireball.jpg"),
        "https://www.scryfly.fake/Images/3.jpg": () => fs.createReadStream("./test_data_files/fireball.jpg"),
        /* eslint-enable prettier/prettier */
      }
    ),
    clock: clock,
    net: new MemoryNetworkManager(jsonFiles),
  };
  await initializeDatabase(services.dbManager, config);
  await startUpdatingImages(services, {
    allMissingCards: false,
    cardIds: ["1", "2", "3"],
  });
  await timeout(1000);

  // Verify the images were converted and stored.
  /* eslint-disable prettier/prettier */
  expect((await services.storagePortal.getObjectAsString("fq", "1.jpg")).length).toBe(202699);
  expect((await services.storagePortal.getObjectAsString("lq", "1.jpg")).length).toBe(52919);

  expect((await services.storagePortal.getObjectAsString("fq", "2.jpg")).length).toBe(202699);
  expect((await services.storagePortal.getObjectAsString("hq", "2.jpg")).length).toBeGreaterThan(83970 * 0.95);
  expect((await services.storagePortal.getObjectAsString("hq", "2.jpg")).length).toBeLessThan(83970 * 1.05);

  expect((await services.storagePortal.getObjectAsString("fq", "3.jpg")).length).toBe(202699);
  expect((await services.storagePortal.getObjectAsString("hq", "3.jpg")).length).toBeGreaterThan(83970 * 0.95);
  expect((await services.storagePortal.getObjectAsString("hq", "3.jpg")).length).toBeLessThan(83970 * 1.05);

  // Verify that card 4 didn't have it's image updated, because we didn't specify it in the call to startUpdatingImages.
  expect(await services.storagePortal.getObjectAsString("lq", "4.jpg")).toBe("");
  /* eslint-enable prettier/prettier */

  // Verify that the reported info matches what we expect.
  const infos = await getAllImageInfos(services);
  expect(infos).not.toBeNull();
  if (!infos) {
    return;
  }

  expect(infos.cardsMissingWithLQAvailable).toEqual(["4"]);
  expect(infos.cardsNotHQWithHQAvailable).toEqual([]);
  expect(infos.countByType[ImageInfo.MISSING]).toBe(1);
  expect(infos.countByType[ImageInfo.NONE]).toBe(0);
  expect(infos.countByType[ImageInfo.LQ]).toBe(1);
  expect(infos.countByType[ImageInfo.HQ]).toBe(2);
  expect(infos.imageTypeByID["1"]).toBe(ImageInfo.LQ);
  expect(infos.imageTypeByID["2"]).toBe(ImageInfo.HQ);
  expect(infos.imageTypeByID["3"]).toBe(ImageInfo.HQ);
  expect(infos.imageTypeByID["4"]).toBe(ImageInfo.MISSING);
  expect(new Date(infos.lastUpdateDate)).toEqual(clock.now());
});

test("Atetmpts to clear a specific CardID from the database", async () => {
  const config = new Config();
  config.storage.externalRoot = "https://www.infinitestorage.fake";
  config.storage.awsS3DataMapBucket = "bucket_name";
  config.storage.awsS3FullQualityImageBucket = "fq";
  config.storage.awsS3HighQualityImageBucket = "hq";
  config.storage.awsS3CompressedImageBucket = "lq";
  const blobPrefix = `${config.storage.externalRoot}/${config.storage.awsS3DataMapBucket}/`;

  const jsonFiles: Record<string, string> = {};
  jsonFiles[`${blobPrefix}IDToLargeImageURI.json`] = JSON.stringify({
    "1": "https://www.scryfly.fake/Images/1.jpg",
  });

  const clock: Clock = {
    now: () => {
      return new Date("2021-01-01T05:00:00");
    },
  };
  const services: Services = {
    config: config,
    dbManager: new MemoryDatabaseManager(),
    file: new MemoryLocalStorage({}),
    perfMon: new PerformanceMonitor(),
    storagePortal: new MemoryStoragePortal(clock),
    scryfallManager: new MemoryScryfallManager({}, {}),
    clock: clock,
    net: new MemoryNetworkManager(jsonFiles),
  };
  await initializeDatabase(services.dbManager, config);

  const connection = await services.dbManager.getConnection();
  await connection!.query(
    "REPLACE INTO card_images (card_id, update_time, quality) VALUES (?, ?, ?);",
    ["1", dateToMySQL(services.clock.now()), ImageInfo.HQ]
  );

  // Verify that the reported info matches what we expect.
  const infos = await getAllImageInfos(services);
  expect(infos).not.toBeNull();
  if (!infos) {
    return;
  }
  expect(infos.countByType[ImageInfo.NONE]).toBe(0);
  expect(infos.countByType[ImageInfo.HQ]).toBe(1);
  expect(infos.imageTypeByID["1"]).toBe(ImageInfo.HQ);

  clearImageInfo(services, { cardIDs: ["1"] });
});

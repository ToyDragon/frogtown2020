import * as fs from "fs";
import { Clock } from "../../server/services/clock";
import Config from "../../server/services/config/config";
import initializeDatabase from "../../server/services/database/initialize_database";
import MemoryDatabaseManager from "../../server/services/database/memory_db_manager";
import MemoryLocalStorage from "../../server/services/local_storage/memory_local_storage";
import MemoryNetworkManager from "../../server/services/network_manager/memory_network_manager";
import { PerformanceMonitor } from "../../server/services/performance_monitor/performance_monitor";
import MemoryScryfallManager from "../../server/services/scryfall_manager/memory_scryfall_manager";
import Services from "../../server/services";
import MemoryStoragePortal from "../../server/services/storage_portal/storage_portal_memory";
import { dateToMySQL, timeout } from "../../shared/utils";
import {
  clearImageInfo,
  getAllImageInfos,
  startUpdatingImages,
} from "./image_management";
import { ImageInfo } from "./types";
import { Level, setLogLevel } from "../../server/log";
import identify from "./identify";

// Verifies the size and color space of a jpg in a storage portal.
async function checkImage(
  portal: MemoryStoragePortal,
  bucket: string,
  key: string,
  colorSpace: string,
  expectedSize: number
): Promise<void> {
  if (colorSpace) {
    expect(
      await identify((await portal.getObjectRaw(bucket, key)) as Buffer)
    ).toContain(colorSpace);
  }
  expect((await portal.getObjectAsString(bucket, key)).length).toBeGreaterThan(
    expectedSize * 0.9
  );
  expect((await portal.getObjectAsString(bucket, key)).length).toBeLessThan(
    expectedSize * 1.1
  );
}

// This test verifies that Card images can be downloaded, resized, and stored in S3.
test("Downloads card images, resizes, and stores them.", async () => {
  jest.setTimeout(10000);
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
  jsonFiles[`${blobPrefix}IDToImageStatus.json`]         = JSON.stringify({ "1": "lowres" });
  jsonFiles[`${blobPrefix}TokenIDToImageStatus.json`]    = JSON.stringify({ "2": "highres_scan" });
  jsonFiles[`${blobPrefix}BackIDToImageStatus.json`]     = JSON.stringify({ "3": "placeholder", "4": "lowres" });
  /* eslint-enable prettier/prettier */

  const clock: Clock = {
    now: () => {
      return new Date("2021-01-01T05:00:00");
    },
  };
  const storage = new MemoryStoragePortal(clock);
  const services: Services = {
    config: config,
    dbManager: new MemoryDatabaseManager(),
    file: new MemoryLocalStorage({}),
    perfMon: new PerformanceMonitor(),
    storagePortal: storage,
    scryfallManager: new MemoryScryfallManager(
      {},
      {
        /* eslint-disable prettier/prettier */
        "https://www.scryfly.fake/Images/1.jpg": () => fs.createReadStream("./test_data_files/fireball.jpg"),
        "https://www.scryfly.fake/Images/2.jpg": () => fs.createReadStream("./test_data_files/fireball.jpg"),
        "https://www.scryfly.fake/Images/3.jpg": () => fs.createReadStream("./test_data_files/monk_class_cymk.jpg"),
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

  // Wait for the image update to finish.
  for (let i = 0; i < 20; ++i) {
    const infos = await getAllImageInfos(services);
    if (infos && infos.countByType[ImageInfo.NONE] === 0) {
      break;
    }
    await timeout(100);
  }

  // Verify the images were converted and stored.
  await checkImage(storage, "fq", "1.jpg", "", 202690);
  await checkImage(storage, "lq", "1.jpg", "sRGB", 52910);

  await checkImage(storage, "fq", "2.jpg", "", 202690);
  await checkImage(storage, "hq", "2.jpg", "sRGB", 83961);
  await checkImage(storage, "lq", "2.jpg", "sRGB", 52910);

  await checkImage(storage, "fq", "3.jpg", "", 72596);
  await checkImage(storage, "hq", "3.jpg", "sRGB", 61655);
  await checkImage(storage, "lq", "3.jpg", "sRGB", 49945);

  // Verify that card 4 didn't have it's image updated, because we didn't specify it in the call to startUpdatingImages.
  expect(await services.storagePortal.getObjectAsString("lq", "4.jpg")).toBe(
    ""
  );

  // Verify that the reported info matches what we expect.
  const infos = await getAllImageInfos(services);
  expect(infos).not.toBeNull();
  if (!infos) {
    return;
  }

  expect(infos.cardsWithUpgradeAvailable).toEqual(["4"]);
  expect(infos.countByType[ImageInfo.MISSING]).toBe(1);
  expect(infos.countByType[ImageInfo.NONE]).toBe(0);
  expect(infos.countByType[ImageInfo.LQ]).toBe(1);
  expect(infos.countByType[ImageInfo.HQ]).toBe(1);
  expect(infos.countByType[ImageInfo.PLACEHOLDER]).toBe(1);
  expect(infos.imageTypeByID["1"]).toBe(ImageInfo.LQ);
  expect(infos.imageTypeByID["2"]).toBe(ImageInfo.HQ);
  expect(infos.imageTypeByID["3"]).toBe(ImageInfo.PLACEHOLDER);
  expect(infos.imageTypeByID["4"]).toBe(ImageInfo.MISSING);
  expect(new Date(infos.lastUpdateDate)).toEqual(clock.now());
  setLogLevel(Level.INFO);
});

test("Attempts to clear a specific CardID from the database", async () => {
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
  jsonFiles[`${blobPrefix}IDToLargeImageURI.json`]      = JSON.stringify({ "1": "s.fake/1.jpg", "2": "s.fake/1.jpg" });
  jsonFiles[`${blobPrefix}TokenIDToLargeImageURI.json`] = JSON.stringify({});
  jsonFiles[`${blobPrefix}BackIDToLargeImageURI.json`]  = JSON.stringify({});
  jsonFiles[`${blobPrefix}IDToImageStatus.json`]         = JSON.stringify({ "1": "highres_scan", "2": "placeholder" });
  jsonFiles[`${blobPrefix}TokenIDToImageStatus.json`]    = JSON.stringify({});
  jsonFiles[`${blobPrefix}BackIDToImageStatus.json`]     = JSON.stringify({});
  jsonFiles[`${blobPrefix}SetCodeToCardID.json`]        = JSON.stringify({});
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
    scryfallManager: new MemoryScryfallManager({}, {}),
    clock: clock,
    net: new MemoryNetworkManager(jsonFiles),
  };
  await initializeDatabase(services.dbManager, config);

  const connection = await services.dbManager.getConnection();
  await connection!.query(
    "REPLACE INTO card_images (card_id, update_time, quality) VALUES (?, ?, ?);",
    ["1", dateToMySQL(services.clock.now()), ImageInfo.PLACEHOLDER]
  );

  // Verify that the reported info matches what we expect.
  let infos = await getAllImageInfos(services);
  expect(infos).not.toBeNull();
  if (!infos) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let expected: Record<any, number> = {};
  expected["1"] = ImageInfo.PLACEHOLDER;
  expected["2"] = ImageInfo.MISSING;
  expect(infos.imageTypeByID).toEqual(expected);
  expected = {};
  expected[ImageInfo.MISSING] = 1;
  expected[ImageInfo.NONE] = 0;
  expected[ImageInfo.LQ] = 0;
  expected[ImageInfo.HQ] = 0;
  expected[ImageInfo.PLACEHOLDER] = 1;
  expect(infos.countByType).toEqual(expected);
  await clearImageInfo(services, { cardIDs: ["1"] }); // Remove card from database
  infos = await getAllImageInfos(services);

  expect(infos!.countByType[ImageInfo.MISSING]).toBe(2);
  expect(infos!.countByType[ImageInfo.PLACEHOLDER]).toBe(0);
  expect(infos!.countByType[ImageInfo.HQ]).toBe(0);
  expect(infos!.imageTypeByID["1"]).toBe(ImageInfo.MISSING);
  expect(infos!.imageTypeByID["2"]).toBe(ImageInfo.MISSING);
  setLogLevel(Level.INFO);
});

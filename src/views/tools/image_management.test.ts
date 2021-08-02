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
import { timeout } from "../../shared/utils";
import { getAllImageInfos, startUpdatingImages } from "./image_management";
import { ImageInfo } from "./types";
import { spawn } from "child_process";
import { Level, setLogLevel } from "../../server/log";

// Helper to save a jpeg buffer to a file, and run imagemagick's identify tool on it.
function identify(jpgData: Buffer): Promise<string> {
  return new Promise((resolve) => {
    // TODO: Remove dependency on the filesystem, see if there's a way to send the data
    // through a stdin stream or something.
    const tmpFile =
      "/tmp/imagemanagement_img_" + Math.floor(Math.random() * 100) + ".jpg";
    fs.writeFile(tmpFile, jpgData, () => {
      const childProc = spawn("identify", [tmpFile]);
      let data: Buffer | null = null;
      childProc.stdout.on("data", (chunk: Buffer) => {
        if (!data) {
          data = chunk;
        } else {
          data = Buffer.concat([data, chunk]);
        }
      });
      childProc.on("exit", () => {
        fs.unlink(tmpFile, () => {
          resolve(data?.toString() || "");
        });
      });
    });
  });
}

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
  jsonFiles[`${blobPrefix}IDToHasHighRes.json`]         = JSON.stringify({ "1": false });
  jsonFiles[`${blobPrefix}TokenIDToHasHighRes.json`]    = JSON.stringify({ "2": true });
  jsonFiles[`${blobPrefix}BackIDToHasHighRes.json`]     = JSON.stringify({ "3": true, "4": false });
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
  await timeout(2000);

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

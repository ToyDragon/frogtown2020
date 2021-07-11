import {
  getAllCardIDs,
  stringArrayToRecord,
  dateToMySQL,
  httpsGet,
} from "../../shared/utils";
import Services from "../../server/services";
import {
  ImageInfo,
  CardImageInfoResponse,
  CardImageUpdateProgressResponse,
  CardImageUpdateStartRequest,
  CardImageClearInfoRequest,
} from "./types";
import { logInfo, logError, logWarning } from "../../server/log";
import { DatabaseConnection } from "../../server/services/database/db_connection";
import * as stream from "stream";
import imagemagick from "imagemagick-stream";
import { CardImagesRow } from "../../server/services/database/dbinfos/db_info_card_images";
import { trySetBatchInProgress, endBatch } from "./batch_status";
import { BatchStatusRow } from "../../server/services/database/dbinfos/db_info_batch_status";

async function getIDToHQMap(
  services: Services
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const mapName of [
    "IDToHasHighRes",
    "TokenIDToHasHighRes",
    "BackIDToHasHighRes",
  ]) {
    const submap = await services.net.httpsGetJson<Record<string, boolean>>(
      `${services.config.storage.externalRoot}/${services.config.storage.awsS3DataMapBucket}/${mapName}.json`
    );
    if (!submap) {
      throw new Error(`Missing submap ${mapName}`);
    }
    for (const id in submap) {
      result[id] = submap[id];
    }
  }
  return result;
}

async function getIDToImageURIMap(
  services: Services
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const mapName of [
    "IDToLargeImageURI",
    "TokenIDToLargeImageURI",
    "BackIDToLargeImageURI",
  ]) {
    const submap = await services.net.httpsGetJson<Record<string, string>>(
      `${services.config.storage.externalRoot}/${services.config.storage.awsS3DataMapBucket}/${mapName}.json`
    );
    if (!submap) {
      throw new Error(`Missing submap ${mapName}`);
    }
    for (const id in submap) {
      result[id] = submap[id];
    }
  }
  return result;
}

export async function getAllImageInfos(
  services: Services
): Promise<CardImageInfoResponse | null> {
  const connection = await services.dbManager.getConnectionTimeout(
    5 * 60 * 1000 // 5 minute timeout
  );
  if (!connection) {
    return null;
  }
  const allInfos: Record<string, ImageInfo> = {};
  let lastUpdateDate: Date | null = null;
  const cardsNotHQWithHQAvailable: string[] = [];
  const cardsMissingWithLQAvailable: string[] = [];
  const allKnownIds = stringArrayToRecord(await getAllCardIDs(services));
  let IDToHighResAvail!: Record<string, boolean>;
  let IDToLargeImage!: Record<string, string>;
  try {
    IDToHighResAvail = await getIDToHQMap(services);
    IDToLargeImage = await getIDToImageURIMap(services);
  } catch (e) {
    logError(e);
    return null;
  }

  const allImageInfos = await connection.query<CardImagesRow[]>(
    "SELECT * FROM card_images;",
    []
  );
  connection.release();

  // Handle all cards that have known image states
  if (allImageInfos && allImageInfos.value) {
    logInfo("card_images row count: " + allImageInfos.value.length);
    for (const info of allImageInfos.value) {
      allInfos[info.card_id] = info.quality;
      const thisDate = new Date(info.update_time + " UTC");
      const highResAvailable = IDToHighResAvail[info.card_id];
      if (info.quality !== ImageInfo.HQ && highResAvailable) {
        cardsNotHQWithHQAvailable.push(info.card_id);
      }
      const imageAvailable = IDToLargeImage[info.card_id];
      if (
        (info.quality === ImageInfo.NONE ||
          info.quality === ImageInfo.MISSING) &&
        imageAvailable
      ) {
        cardsMissingWithLQAvailable.push(info.card_id);
      }
      if (thisDate && (!lastUpdateDate || lastUpdateDate < thisDate)) {
        lastUpdateDate = thisDate;
      }
    }
  }

  // Handle cards that are not yet in the card_image table.
  for (const cardId in allKnownIds) {
    if (typeof allInfos[cardId] === "undefined") {
      allInfos[cardId] = ImageInfo.MISSING;
      if (IDToLargeImage[cardId]) {
        if (IDToHighResAvail[cardId]) {
          cardsNotHQWithHQAvailable.push(cardId);
        } else {
          cardsMissingWithLQAvailable.push(cardId);
        }
      }
    }
  }

  const counts: { [type: number]: number } = {};
  counts[ImageInfo.MISSING] = 0;
  counts[ImageInfo.NONE] = 0;
  counts[ImageInfo.LQ] = 0;
  counts[ImageInfo.HQ] = 0;

  for (const cardId in allInfos) {
    counts[allInfos[cardId]] = counts[allInfos[cardId]] || 0;
    counts[allInfos[cardId]] += 1;
  }

  return {
    imageTypeByID: allInfos,
    countByType: counts,
    lastUpdateDate: lastUpdateDate ? dateToMySQL(lastUpdateDate) + " UTC" : "",
    cardsNotHQWithHQAvailable: cardsNotHQWithHQAvailable,
    cardsMissingWithLQAvailable: cardsMissingWithLQAvailable,
  };
}
interface PendingImageDetails {
  cardId: string;
  isHighRes: boolean;
}
let imagesBeingUpdated: PendingImageDetails[] | null = null;
let imageUpdateIndex = 0;

function getResultLineZero(result: BatchStatusRow[] | null): string {
  if (!result || result.length === 0 || !result[0]) {
    return "";
  }
  return result[0].value;
}

export async function getImageUpdateProgress(
  services: Services
): Promise<CardImageUpdateProgressResponse> {
  const connection = await services.dbManager.getConnection();
  const result = {
    position: 0,
    max: 0,
  };
  if (!connection) {
    return result;
  }

  let data = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["update_images_count"]
  );
  result.position = Number(getResultLineZero(data.value));
  data = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["update_images_max"]
  );
  result.max = Number(getResultLineZero(data.value));

  connection.release();
  return result;
}

export async function clearImageInfo(
  services: Services,
  clearInfoRequest: CardImageClearInfoRequest
): Promise<void> {
  const connection = await services.dbManager.getConnectionTimeout(
    20 * 60 * 1000 // 20 minute timeout
  );
  if (!connection) {
    return;
  }
  if (!(await trySetBatchInProgress(connection))) {
    connection.release();
    return;
  }
  const SetCodeToCardID = await httpsGet<Record<string, string>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/SetCodeToID.json"
  );

  if (!SetCodeToCardID) {
    logError("Unable to load data map from S3.");
    await endBatch(connection);
    connection.release();
    return;
  }

  let cardCount = 0;
  for (const set of clearInfoRequest.sets) {
    if (SetCodeToCardID[set]) {
      for (const cardId of SetCodeToCardID[set]) {
        cardCount++;
        await connection.query("DELETE FROM card_images WHERE card_id=?;", [
          cardId,
        ]);
      }
    }
  }

  logInfo(`Cleared images for ${cardCount} cards.`);

  await endBatch(connection);
  connection.release();
}

export async function startUpdatingImages(
  services: Services,
  updateImageRequest: CardImageUpdateStartRequest
): Promise<void> {
  const connection = await services.dbManager.getConnectionTimeout(
    20 * 60 * 1000 // 20 minute timeout
  );
  if (!connection) {
    return;
  }
  if (!(await trySetBatchInProgress(connection))) {
    connection.release();
    return;
  }

  let IDToHighResAvail!: Record<string, boolean>;
  let IDToLargeImage!: Record<string, string>;
  try {
    IDToHighResAvail = await getIDToHQMap(services);
    IDToLargeImage = await getIDToImageURIMap(services);
  } catch (e) {
    logError(e);
    return;
  }

  if (updateImageRequest.allMissingCards) {
    //TODO: I'll implement this when most/all cards are done.
  } else {
    imagesBeingUpdated = [];
    for (const cardId of updateImageRequest.cardIds) {
      imagesBeingUpdated.push({
        cardId: cardId,
        isHighRes: IDToHighResAvail[cardId],
      });
    }
    logInfo(
      "About to load images for cards: " +
        updateImageRequest.cardIds.length +
        " cards."
    );
  }

  if (imagesBeingUpdated === null) {
    return;
  }

  imageUpdateIndex = 0;

  await connection.query<BatchStatusRow[]>(
    "REPLACE INTO batch_status (name, value) VALUES (?, ?), (?, ?);",
    ["update_images_count", "0", "update_images_max", imagesBeingUpdated.length]
  );

  loadNextImage(services, IDToLargeImage, connection);
}

async function loadNextImage(
  services: Services,
  imageMap: Record<string, string>,
  connection: DatabaseConnection
): Promise<void> {
  if (imageUpdateIndex >= (imagesBeingUpdated?.length || 0)) {
    logInfo("Done loading images");
    imagesBeingUpdated = null;
    imageUpdateIndex = 0;
    await connection.query<BatchStatusRow[]>(
      "REPLACE INTO batch_status (name, value) VALUES (?, ?), (?, ?);",
      ["update_images_count", "0", "update_images_max", "0"]
    );
    await endBatch(connection);
    connection.release();
  } else {
    if (imageUpdateIndex % 20 === 0) {
      await connection.query<BatchStatusRow[]>(
        "REPLACE INTO batch_status (name, value) VALUES (?, ?);",
        ["update_images_count", imageUpdateIndex]
      );
    }
    loadOneImage(services, imageMap, connection);
    imageUpdateIndex += 1;
  }
}

function loadOneImage(
  services: Services,
  imageMap: Record<string, string>,
  connection: DatabaseConnection
): void {
  const imgToLoad = imageUpdateIndex;
  if (!imagesBeingUpdated) {
    logError(
      "Failed to load image from scryfall because card ID list lost somehow?"
    );
    return;
  }

  const cardDetails = imagesBeingUpdated[imgToLoad];
  if (!cardDetails) {
    logError(
      "Failed to load image from scryfall because card ID not found. " +
        imgToLoad +
        "/" +
        imagesBeingUpdated.length
    );
    return;
  }

  const url = imageMap[cardDetails.cardId];
  if (!url) {
    logWarning(
      "Failed to load image from scryfall because no scryfall image available."
    );
    loadNextImage(services, imageMap, connection);
    return;
  }

  const awsFullQualityStream = services.storagePortal.uploadStreamToBucket(
    services.config.storage.awsS3FullQualityImageBucket,
    cardDetails.cardId + ".jpg"
  );

  const awsHighQualityStream = services.storagePortal.uploadStreamToBucket(
    services.config.storage.awsS3HighQualityImageBucket,
    cardDetails.cardId + ".jpg"
  );

  const awsLowQualityStream = services.storagePortal.uploadStreamToBucket(
    services.config.storage.awsS3CompressedImageBucket,
    cardDetails.cardId + ".jpg"
  );

  services.scryfallManager.requestStream(url).then((inStream) => {
    if (!inStream) {
      logError("Failed to get S3 upstream for image.");
      return;
    }

    inStream.pipe(awsFullQualityStream);
    inStream
      .pipe(
        (imagemagick()
          .resize("672x936")
          .quality(40) as unknown) as stream.Writable
      )
      .pipe(awsHighQualityStream);
    inStream
      .pipe(
        (imagemagick()
          .resize("672x936")
          .quality(20) as unknown) as stream.Writable
      )
      .pipe(awsLowQualityStream);

    inStream.on("end", async () => {
      logInfo("Done loading image " + imgToLoad);
      await connection.query(
        "REPLACE INTO card_images (card_id, update_time, quality) VALUES (?, ?, ?);",
        [
          cardDetails.cardId,
          dateToMySQL(services.clock.now()),
          cardDetails.isHighRes ? ImageInfo.HQ : ImageInfo.LQ,
        ]
      );
      loadNextImage(services, imageMap, connection);
    });
  });
}

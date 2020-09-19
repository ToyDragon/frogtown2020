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
} from "./types";
import { logInfo, logError, logWarning } from "../../server/log";
import { DatabaseConnection } from "../../server/database/db_connection";
import * as stream from "stream";
import imagemagick from "imagemagick-stream";
import { CardImagesRow } from "../../server/database/dbinfos/db_info_card_images";

export async function getAllImageInfos(
  services: Services
): Promise<CardImageInfoResponse | null> {
  const allInfos: Record<string, ImageInfo> = {};
  const connection = await services.dbManager.getConnectionTimeout(30000);
  let lastUpdateDate: Date | null = null;
  const cardsNotHQWithHQAvailable: string[] = [];
  const cardsMissingWithLQAvailable: string[] = [];
  if (connection) {
    const allKnownIds = stringArrayToRecord(
      await getAllCardIDs(services.config)
    );
    const IDToHighResAvail = await httpsGet<Record<string, boolean>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/IDToHasHighRes.json"
    );
    const TokenIDToHighResAvail = await httpsGet<Record<string, boolean>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/TokenIDToHasHighRes.json"
    );
    const BackIDToHighResAvail = await httpsGet<Record<string, boolean>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/BackIDToHasHighRes.json"
    );
    const IDToLargeImage = await httpsGet<Record<string, string>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/IDToLargeImageURI.json"
    );
    const TokenIDToLargeImage = await httpsGet<Record<string, string>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/TokenIDToLargeImageURI.json"
    );
    const BackIDToLargeImage = await httpsGet<Record<string, string>>(
      services.config.storage.externalRoot +
        "/" +
        services.config.storage.awsS3DataMapBucket +
        "/BackIDToLargeImageURI.json"
    );
    const allImageInfos = await connection.query<CardImagesRow[]>(
      "SELECT * FROM card_images;",
      []
    );
    connection.release();

    if (
      !IDToHighResAvail ||
      !TokenIDToHighResAvail ||
      !BackIDToHighResAvail ||
      !IDToLargeImage ||
      !TokenIDToLargeImage ||
      !BackIDToLargeImage
    ) {
      logError("Unable to load data maps from S3.");
      return null;
    }

    // Handle all cards that have known image states
    if (allImageInfos && allImageInfos.value) {
      logInfo("card_images row count: " + allImageInfos.value.length);
      for (const info of allImageInfos.value) {
        allInfos[info.card_id] = info.quality;
        const thisDate = new Date(info.update_time + " UTC");
        const highResAvailable =
          IDToHighResAvail[info.card_id] ||
          TokenIDToHighResAvail[info.card_id] ||
          BackIDToHighResAvail[info.card_id];
        if (info.quality !== ImageInfo.HQ && highResAvailable) {
          cardsNotHQWithHQAvailable.push(info.card_id);
        }
        const imageAvailable =
          IDToLargeImage[info.card_id] ||
          TokenIDToLargeImage[info.card_id] ||
          BackIDToLargeImage[info.card_id];
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
        if (
          IDToLargeImage[cardId] ||
          TokenIDToLargeImage[cardId] ||
          BackIDToLargeImage[cardId]
        ) {
          if (
            IDToHighResAvail[cardId] ||
            TokenIDToHighResAvail[cardId] ||
            BackIDToHighResAvail[cardId]
          ) {
            cardsNotHQWithHQAvailable.push(cardId);
          } else {
            cardsMissingWithLQAvailable.push(cardId);
          }
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

export async function getImageUpdateProgress(): Promise<
  CardImageUpdateProgressResponse
> {
  return {
    position: imageUpdateIndex,
    max: imagesBeingUpdated?.length || 0,
  };
}

export async function startUpdatingImages(
  services: Services,
  updateImageRequest: CardImageUpdateStartRequest
): Promise<void> {
  if (imagesBeingUpdated !== null) {
    return;
  }

  const idToLargeImage = await httpsGet<Record<string, string>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/IDToLargeImageURI.json"
  );
  const TokenIDToLargeImage = await httpsGet<Record<string, string>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/TokenIDToLargeImageURI.json"
  );
  const BackIDToLargeImage = await httpsGet<Record<string, string>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/BackIDToLargeImageURI.json"
  );
  const IDToHighResAvail = await httpsGet<Record<string, boolean>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/IDToHasHighRes.json"
  );
  const TokenIDToHighResAvail = await httpsGet<Record<string, boolean>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/TokenIDToHasHighRes.json"
  );
  const BackIDToHighResAvail = await httpsGet<Record<string, boolean>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/BackIDToHasHighRes.json"
  );

  if (
    !idToLargeImage ||
    !TokenIDToLargeImage ||
    !BackIDToLargeImage ||
    !IDToHighResAvail ||
    !TokenIDToHighResAvail ||
    !BackIDToHighResAvail
  ) {
    logError("Unable to load data maps from S3.");
    return;
  }

  if (updateImageRequest.allMissingCards) {
    //TODO: I'll implement this when most/all cards are done.
  } else {
    imagesBeingUpdated = [];
    for (const cardId of updateImageRequest.cardIds) {
      imagesBeingUpdated.push({
        cardId: cardId,
        isHighRes:
          IDToHighResAvail[cardId] ||
          TokenIDToHighResAvail[cardId] ||
          BackIDToHighResAvail[cardId],
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

  const connection = await services.dbManager.getConnection();
  if (connection) {
    imageUpdateIndex = 0;
    loadNextImage(
      services,
      [idToLargeImage, TokenIDToLargeImage, BackIDToLargeImage],
      connection
    );
  }
}

function loadNextImage(
  services: Services,
  imageMaps: Record<string, string>[],
  connection: DatabaseConnection
): void {
  if (imageUpdateIndex >= (imagesBeingUpdated?.length || 0)) {
    logInfo("Done loading images");
    imagesBeingUpdated = null;
    imageUpdateIndex = 0;
    connection.release();
  } else {
    loadOneImage(services, imageMaps, connection);
    imageUpdateIndex += 1;
  }
}

function loadOneImage(
  services: Services,
  imageMaps: Record<string, string>[],
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

  let url = "";
  for (const map of imageMaps) {
    url = url || map[cardDetails.cardId];
  }
  if (!url) {
    logWarning(
      "Failed to load image from scryfall because no scryfall image available."
    );
    loadNextImage(services, imageMaps, connection);
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
          dateToMySQL(new Date()),
          cardDetails.isHighRes ? ImageInfo.HQ : ImageInfo.LQ,
        ]
      );
      loadNextImage(services, imageMaps, connection);
    });
  });
}

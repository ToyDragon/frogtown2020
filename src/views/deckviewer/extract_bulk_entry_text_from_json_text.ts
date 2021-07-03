import { TTSDeck } from "../shared/client/exporter/tts_deck";
import { extractCardIDFromImageURL } from "./extract_cardid_from_image_url";

function imageIndexFromCardID(cardID: number): string {
  // CardIDs have the card index in the ones and tens place, and the image index in the remaining numbers.
  return Math.floor(cardID / 100).toString();
}

// TODO: Extract this to somewhere else so it can be shared.
// Recursively makes all properties optional on a type.
type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export function extractBulkEntryTextFromJSONText(fileText: string): string {
  let deck: DeepPartial<TTSDeck> | null = null;
  try {
    deck = JSON.parse(fileText) as DeepPartial<TTSDeck>;
  } catch {
    return "";
  }
  if (!deck.ObjectStates) {
    return "";
  }
  let bulkEntryText = "";
  for (const obj of deck.ObjectStates) {
    if (!obj?.ContainedObjects) {
      continue;
    }
    const indexToCount: Record<string, number> = {};
    for (const cardObj of obj.ContainedObjects) {
      if (!cardObj?.CardID) {
        continue;
      }
      const imageIndex = imageIndexFromCardID(cardObj.CardID);
      indexToCount[imageIndex] = indexToCount[imageIndex] || 0;
      indexToCount[imageIndex]++;
    }
    if (!obj?.CustomDeck) {
      continue;
    }
    for (const imageIndex in obj.CustomDeck) {
      if (!indexToCount[imageIndex]) {
        continue;
      }
      const img = obj.CustomDeck[imageIndex];
      if (!img?.BackIsHidden) {
        continue;
      }
      const cardID = extractCardIDFromImageURL(img.FaceURL || "");
      if (!cardID) {
        continue;
      }
      bulkEntryText += `${indexToCount[imageIndex]} ${cardID}\n`;
    }
  }
  return bulkEntryText;
}

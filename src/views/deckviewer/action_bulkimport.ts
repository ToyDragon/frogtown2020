import { showPopup } from "../shared/client/utils";
import { DataLoader } from "../shared/client/data_loader";

export default function setupBulkImport(
  dl: DataLoader,
  addAction: (cardId: string) => void
): void {
  const inputArea = document.querySelector(
    "#bulkInputArea"
  ) as HTMLTextAreaElement;
  if (!inputArea) {
    return;
  }
  inputArea.addEventListener("drop", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files) {
      for (const file of files) {
        if (file.type === "application/json") {
          const reader = new FileReader();
          reader.onload = (read_event) => {
            const card_url_reg = /https:\/\/[a-z]+\.frogtown\.me\/Images\/[V0-9]+\/([a-zA-Z0-9-]{36})\.jpg/;
            try {
              let ids = "";
              const deck = JSON.parse(
                read_event.target?.result?.toString() || "{}"
              );
              const objs = deck["ObjectStates"];
              if (objs) {
                for (const obj of objs) {
                  const ix_to_count: Record<string, number> = {};
                  for (const card_obj of obj["ContainedObjects"]) {
                    const img_ix = Math.floor(card_obj.CardID / 100);
                    ix_to_count[img_ix.toString()] =
                      ix_to_count[img_ix.toString()] || 0;
                    ix_to_count[img_ix.toString()]++;
                  }
                  const deck_images = obj["CustomDeck"];
                  if (deck_images) {
                    for (const i in deck_images) {
                      const img = deck_images[i];
                      if (img["BackIsHidden"]) {
                        const result = card_url_reg.exec(img["FaceURL"]);
                        if (result && ix_to_count[i]) {
                          ids += ix_to_count[i] + " " + result[1] + "\n";
                        }
                      }
                    }
                  }
                }
              }
              inputArea.value = ids;
            } catch (_) {
              //
            }
          };
          reader.readAsText(file);
        }
      }
    }
  });

  document.querySelector("#actionBulkImport")?.addEventListener("click", () => {
    inputArea.value = "";
    const inputAreaError = document.querySelector(
      "#bulkInputErr"
    ) as HTMLHeadingElement;
    inputAreaError.textContent = "";
    showPopup(document.querySelector("#importOverlay"));
  });
  document.querySelector("#btnConfirmImport")?.addEventListener("click", () => {
    const nameToID = dl.getMapData("NameToID");
    if (!nameToID) {
      return;
    }
    const result = getCardsByName(inputArea.value, nameToID);
    const inputAreaError = document.querySelector(
      "#bulkInputErr"
    ) as HTMLHeadingElement;
    if (result.errors.length) {
      inputAreaError.textContent = "Can't find " + result.errors.join(", ");
    } else {
      for (const cardId of result.ids) {
        addAction(cardId);
      }
      document.querySelector("#importOverlay")?.classList.add("nodisp");
    }
  });
  document
    .querySelector("#btnCloseImportPopup")
    ?.addEventListener("click", () => {
      document.querySelector("#importOverlay")?.classList.add("nodisp");
    });
}

// Remove a bunch of entropy from a card name. For example, turns "Waste Land" into "wasteland".
// This is used later for comparing card names, so it should retain enough information so that the intended cards can be matched.
function lowEntropyName(original_name: string): string {
  return original_name
    .toLowerCase()
    .split("/")[0]
    .replace(/[^a-zA-Z]/g, "");
}

function constructLowEntropyNameMap(
  nameToID: Record<string, string[]>
): { [name: string]: string } {
  const lowEntropyNameToID: { [name: string]: string } = {};
  for (const name in nameToID) {
    const id = nameToID[name][0];
    const leName = lowEntropyName(name);
    lowEntropyNameToID[leName] = id;
  }
  return lowEntropyNameToID;
}

function constructLowercaseNameMap(
  nameToID: Record<string, string[]>
): { [name: string]: string } {
  const lowercaseNameToID: { [name: string]: string } = {};
  for (const name in nameToID) {
    const id = nameToID[name][0];
    lowercaseNameToID[name.toLowerCase()] = id;
  }
  return lowercaseNameToID;
}

interface BulkEntryLinePieces {
  count: number;
  text: string;
}

function splitBulkEntryLine(line: string): BulkEntryLinePieces | null {
  const splitRegex = /([0-9]+)?x?\s*([a-zA-Z0-9, '`-]+)/;
  const result = splitRegex.exec(line);
  if (!result) {
    return null;
  }

  return {
    count: Number(result[1] || "1"),
    text: result[2],
  };
}

function checkForExactCardId(pieces: BulkEntryLinePieces): string | null {
  const idRegex = /[a-z0-9-]{36}/;
  if (!pieces.text.match(idRegex)) {
    return null;
  }
  return pieces.text;
}

export function getCardsByName(
  bulkName: string,
  nameToID: Record<string, string[]>
): { ids: string[]; errors: string[] } {
  const result: { ids: string[]; errors: string[] } = { ids: [], errors: [] };
  const rawLines = (bulkName + "").split("\n");

  // These maps are very expensive to construct, but we do it anyways because this only happens once when performing a bulk import.
  // Bulk imports are typically slow, and this contributes to that, but it's an intended trade off for legible code.
  const lowEntropyNameToID = constructLowEntropyNameMap(nameToID);
  const lowercaseNameToID = constructLowercaseNameMap(nameToID);

  for (const rawLine of rawLines) {
    const pieces = splitBulkEntryLine(rawLine);
    if (!pieces) {
      // The line was likely empty, ignore it.
      continue;
    }
    let cardId: string | null = checkForExactCardId(pieces);
    if (!cardId) {
      cardId = lowercaseNameToID[pieces.text.toLowerCase()];
    }
    if (!cardId) {
      cardId = lowEntropyNameToID[lowEntropyName(pieces.text)];
    }
    if (!cardId) {
      result.errors.push(pieces.text);
      continue;
    }

    for (let i = 0; i < pieces.count; i++) {
      result.ids.push(cardId);
    }
  }
  return result;
}

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
    const idToName = dl.getMapData("IDToName");
    if (!nameToID || !idToName) {
      return;
    }
    const result = getCardsByName(inputArea.value, nameToID, idToName);
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

export function getCardsByName(
  bulkName: string,
  nameToID: Record<string, string[]>,
  idToName: Record<string, string>
): { ids: string[]; errors: string[] } {
  const parseRegex = /([0-9]+)?x?\s*([a-zA-Z0-9, '`-]+)/;
  const result: { ids: string[]; errors: string[] } = { ids: [], errors: [] };
  const rawLines = (bulkName + "").split("\n");
  const cleanNameMap: { [name: string]: string[] } = {};

  const cleanName = (name?: string) => {
    return (name + "")
      .toLowerCase()
      .split("/")[0]
      .replace(/[^a-zA-Z]/g, "");
  };

  for (const name in nameToID) {
    const id = nameToID[name][0];
    const cname = cleanName(name);
    cleanNameMap[cname] = cleanNameMap[cname] || [];
    cleanNameMap[cname].push(id);
  }

  const id_regex = /[a-z0-9-]{36}/;
  for (const rawLine of rawLines) {
    const res = parseRegex.exec(rawLine);
    if (res) {
      let cardId = "";
      const count = res[1] || 1;
      if (res[2].match(id_regex)) {
        cardId = res[2];
      } else {
        const name = cleanName(res[2]);
        if(cleanNameMap[name]) {
          cardId = cleanNameMap[name][0];
          for(const id of cleanNameMap[name]) {
            if(idToName[id].toLowerCase() === res[2].toLowerCase()) {
              cardId = id;
              break;
            }
          }
        }
      }
      if (!cardId) {
        result.errors.push(res[2]);
      } else {
        for (let i = 0; i < count; i++) {
          result.ids.push(cardId);
        }
      }
    }
  }
  return result;
}

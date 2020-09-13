import { showPopup } from "../shared/client/utils";
import { DataLoader } from "../shared/client/data_loader";

export default function setupBulkImport(
  dl: DataLoader,
  addAction: (cardId: string) => void
): void {
  document.querySelector("#actionBulkImport")?.addEventListener("click", () => {
    const inputArea = document.querySelector(
      "#bulkInputArea"
    ) as HTMLTextAreaElement;
    inputArea.value = "";
    const inputAreaError = document.querySelector(
      "#bulkInputErr"
    ) as HTMLHeadingElement;
    inputAreaError.textContent = "";
    showPopup(document.querySelector("#importOverlay"));
  });
  document.querySelector("#btnConfirmImport")?.addEventListener("click", () => {
    const inputArea = document.querySelector(
      "#bulkInputArea"
    ) as HTMLTextAreaElement;

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

export function getCardsByName(
  bulkName: string,
  nameToID: Record<string, string[]>
): { ids: string[]; errors: string[] } {
  const parseRegex = /([0-9]+)?x?\s*([a-zA-Z, '`-]+)/;
  const result: { ids: string[]; errors: string[] } = { ids: [], errors: [] };
  const rawLines = (bulkName + "").split("\n");
  const cleanNameMap: { [name: string]: string } = {};

  const cleanName = (name?: string) => {
    return (name + "")
      .toLowerCase()
      .split("/")[0]
      .replace(/[^a-zA-Z]/g, "");
  };

  for (const name in nameToID) {
    const id = nameToID[name][0];
    const cname = cleanName(name);
    cleanNameMap[cname] = id;
  }

  for (const rawLine of rawLines) {
    const res = parseRegex.exec(rawLine);
    if (res) {
      const count = res[1] || 1;
      const name = cleanName(res[2]);
      const cardId = cleanNameMap[name];
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

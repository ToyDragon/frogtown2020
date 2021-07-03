import { showPopup } from "../shared/client/utils";
import { DataLoader } from "../shared/client/data_loader";
import { extractBulkEntryTextFromJSONText } from "./extract_bulk_entry_text_from_json_text";
import { parseBulkEntryTextToCardIDs } from "./parse_bulkentry_text_to_cardids";

function asyncReadAsText(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      try {
        resolve(readEvent.target!.result!.toString());
      } catch {
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
}

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

  // Support for dropping existing deck files on the bulk import text area.
  inputArea.addEventListener("drop", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) {
      return;
    }
    for (const file of files) {
      if (file.type !== "application/json") {
        continue;
      }
      const deck = await asyncReadAsText(file);
      if (!deck) {
        continue;
      }
      inputArea.value = extractBulkEntryTextFromJSONText(deck);
    }
  });

  // Clicking the import button brings up the import popup.
  document.querySelector("#actionBulkImport")?.addEventListener("click", () => {
    inputArea.value = "";
    const inputAreaError = document.querySelector(
      "#bulkInputErr"
    ) as HTMLHeadingElement;
    inputAreaError.textContent = "";
    showPopup(document.querySelector("#importOverlay"));
  });

  // Clicking confirm in the import popup shows errors, or performs the import.
  document.querySelector("#btnConfirmImport")?.addEventListener("click", () => {
    const nameToID = dl.getMapData("NameToID");
    if (!nameToID) {
      return;
    }
    const result = parseBulkEntryTextToCardIDs(inputArea.value || "", nameToID);
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

  // Close button in the popup.
  document
    .querySelector("#btnCloseImportPopup")
    ?.addEventListener("click", () => {
      document.querySelector("#importOverlay")?.classList.add("nodisp");
    });
}

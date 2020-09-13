import { Deck } from "../shared/deck_types";
import { post } from "../shared/client/request";
import { DeckViewerChangeName } from "./types";

let editingName = false;

export default function setupEditName(
  detailsRetriever: () => Deck,
  afterChange: () => void
): void {
  const nameEntry = document.querySelector("#nameEntry") as HTMLInputElement;
  const actionNameChange = document.querySelector(
    "#actionChangeName"
  ) as HTMLElement;
  const nameDisplay = document.querySelector("#mainNameDisplay") as HTMLElement;
  nameDisplay.innerText = detailsRetriever().name;
  const doneEditingName = () => {
    if (saveNameChange(detailsRetriever(), afterChange)) {
      nameEntry.classList.add("nodisp");
      nameDisplay.classList.remove("nodisp");
      editingName = false;
    }
  };
  nameEntry.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
      doneEditingName();
    }
  });
  actionNameChange.addEventListener("click", () => {
    if (editingName) {
      doneEditingName();
    } else {
      nameEntry.classList.remove("nodisp");
      nameEntry.value = detailsRetriever().name;
      nameEntry.focus();
      nameDisplay.classList.add("nodisp");
      editingName = true;
    }
  });
}

function saveNameChange(deck: Deck, afterChange: () => void): boolean {
  const errorDisplay = document.querySelector("#divNameErr") as HTMLDivElement;
  const nameEntry = document.querySelector("#nameEntry") as HTMLInputElement;
  const newName = (nameEntry.value + "").trim();
  if (newName.length < 100 && newName.length > 0) {
    errorDisplay.classList.add("nodisp");
    deck.name = newName;
    afterChange();
    post<DeckViewerChangeName, boolean>("/deckViewer/updateName", {
      deckId: deck.id,
      name: deck.name,
    });
    return true;
  } else {
    errorDisplay.classList.remove("nodisp");
    return false;
  }
}

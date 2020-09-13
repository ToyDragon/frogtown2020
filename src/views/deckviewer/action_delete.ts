import { showPopup } from "../shared/client/utils";
import { post } from "../shared/client/request";

export default function setupDelete(allowEdit: boolean, deckId: string): void {
  const deleteBtn = document.querySelector("#actionDelete");
  if (!allowEdit) {
    deleteBtn?.classList.add("nodisp");
    return;
  }

  deleteBtn?.addEventListener("click", () => {
    showPopup(document.querySelector("#deleteOverlay"));
  });
  document
    .querySelector("#btnCloseDeletePopup")
    ?.addEventListener("click", () => {
      document.querySelector("#deleteOverlay")?.classList.add("nodisp");
    });
  document
    .querySelector("#btnConfirmDelete")
    ?.addEventListener("click", async () => {
      document.querySelector("#deleteOverlay")?.classList.add("nodisp");
      await post("/deckViewer/deleteDeck/" + deckId, {});
      window.location.replace("/cardsearch.html");
    });
}

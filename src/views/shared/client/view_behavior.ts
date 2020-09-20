import AuthSession from "./authentication";
import ToolbarController from "./toolbar_controller";
import { DataLoader } from "./data_loader";
import { post } from "./request";
import { ToolbarNewDeckResponse } from "../handler_types";
import { Deck } from "../deck_types";

declare let includedData: unknown;

interface DefaultData {
  userDetails: {
    name: string;
    backUrl: string;
  };
  decks: Deck[];
}

export default class ViewBehavior<K> {
  public authSession: AuthSession;
  public tbController: ToolbarController;
  public dl: DataLoader;

  public constructor() {
    this.dl = new DataLoader(null);
    this.authSession = new AuthSession();
    this.tbController = new ToolbarController();
    this.dl.init().then(async () => {
      await this.authSession.ensureValidUser();
      this.ready();
    });

    const newDeckBtn = document.querySelector("#tbNewDeck");
    if (newDeckBtn) {
      newDeckBtn.addEventListener("click", async () => {
        const deckData = await post<void, ToolbarNewDeckResponse>(
          "/toolbar/newdeck",
          undefined
        );
        window.location.replace(
          "/deckViewer/" + deckData?.deckId + "/edit.html"
        );
      });
    }
  }

  public getIncludedData(): K & DefaultData {
    return includedData as K & DefaultData;
  }

  public async ready(): Promise<void> {}
}

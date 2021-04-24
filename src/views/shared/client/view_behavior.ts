import AuthSession from "./authentication";
import ToolbarController from "./toolbar_controller";
import { DataLoader } from "./data_loader";
import { Deck } from "../deck_types";

declare let includedData: unknown;

interface DefaultData {
  userDetails: {
    name: string;
    backUrl: string;
    error: boolean;
  };
  decks: Deck[];
  auth: {
    errorOccurred: boolean;
  };
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
      await this.authSession.ensureValidUser(
        this.getIncludedData().userDetails.error
      );
      this.tbController.documentReady(this.dl.dataDetails!);
      this.ready();
    });
  }

  public getIncludedData(): K & DefaultData {
    return includedData as K & DefaultData;
  }

  public async ready(): Promise<void> {}
}

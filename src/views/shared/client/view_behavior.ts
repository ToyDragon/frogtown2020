import AuthSession from "./authentication";
import ToolbarController from "./toolbar_controller";
import { Deck } from "../deck_types";
import { BlobStorageDataLoader } from "./blob_storage_data_loader";

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
  public dl: BlobStorageDataLoader;

  public constructor() {
    this.dl = new BlobStorageDataLoader(null);
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

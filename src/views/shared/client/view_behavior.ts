import AuthSession from "./authentication";
import ToolbarController from "./toolbar_controller";
import { DataLoader } from "./data_loader";

export default class ViewBehavior {
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
  }

  public async ready(): Promise<void> {}
}

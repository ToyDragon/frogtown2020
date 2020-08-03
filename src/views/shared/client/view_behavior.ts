import AuthSession from "./authentication";
import ToolbarController from "./toolbar_controller";

export default class ViewBehavior {
  public authSession: AuthSession;
  public tbController: ToolbarController;

  public constructor() {
    this.authSession = new AuthSession();
    this.tbController = new ToolbarController();
    document.addEventListener("DOMContentLoaded", async () => {
      await this.authSession.ensureValidUser();
      this.ready();
    });
  }

  public ready(): void {}
}

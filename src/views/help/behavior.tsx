import ViewBehavior from "../shared/client/view_behavior";

class HelpViewBehavior extends ViewBehavior<unknown> {
  public async ready(): Promise<void> {}
}

// Expose behavior to the window for easier debugging.
const behavior = new HelpViewBehavior();
behavior;

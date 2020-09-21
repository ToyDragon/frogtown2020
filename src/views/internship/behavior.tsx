import ViewBehavior from "../shared/client/view_behavior";

class InternshipViewBehavior extends ViewBehavior<unknown> {
  public async ready(): Promise<void> {}
}

// Expose behavior to the window for easier debugging.
const behavior = new InternshipViewBehavior();
behavior;

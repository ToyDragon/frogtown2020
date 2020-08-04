import ViewBehavior from "../shared/client/view_behavior";

class CardSearchBehavior extends ViewBehavior {
  public async ready(): Promise<void> {
    console.log("TODO");
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new CardSearchBehavior();
behavior;

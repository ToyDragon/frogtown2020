import ViewBehavior from "../shared/client/view_behavior";

class CardSearchBehavior extends ViewBehavior {
  ready(): void {
    console.log("TODO");
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new CardSearchBehavior();
behavior;

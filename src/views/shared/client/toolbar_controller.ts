export default class ToolbarController {
  public constructor() {}

  public documentReady(): void {
    $("#tbNewDeck").on("click", () => {
      $.post("/Shared/newDeck", (response) => {
        if (response) {
          const deck = JSON.parse(response);
          if (deck && deck._id) {
            console.log("/deckViewer/" + deck._id + "/edit.html");
            window.location.replace("/deckViewer/" + deck._id + "/edit.html");
          }
        }
      });
    });
  }
}

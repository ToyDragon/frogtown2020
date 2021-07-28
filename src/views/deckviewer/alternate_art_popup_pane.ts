export class AlternateArtPane {
  constructor() {
    document.getElementById("exitIcon")?.addEventListener("click", function () {
      document.getElementById("altPane")!.style.visibility = "hidden";
    });
  }

  open(cardID: string): void {
    document.getElementById("altPane")!.style.visibility = "visible";
    document.getElementById("cardContainer")!.style.background = "red";
    this.renderAltArts(cardID);
  }

  applyFilters(): void {
    console.log("Applying filters");
    return;
  }

  renderAltArts(cardID: string): void {
    console.log("Rendering alternate artwork for cardID: " + cardID);
    return;
  }

  replaceAll(cardID: string): void {
    console.log("Replacing all artworks for cardID: " + cardID);
    return;
  }
}

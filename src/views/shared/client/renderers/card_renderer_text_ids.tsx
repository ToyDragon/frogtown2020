import { MiscOptions } from "../cardfilters/filter_misc_options";
import { MapData } from "../blob_storage_data_loader";
import { CardRendererText } from "./card_renderer_text";

export class CardRendererTextIDs extends CardRendererText {
  public GetDisplayName(): string {
    return "TextIDs";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return ["IDToName"];
  }

  public ChangeCardSet(cardIds: string[], _miscOptions: MiscOptions): void {
    let text = "";

    const allCardIDs: { [id: string]: boolean } = {};
    if (!cardIds || cardIds.length === 0) {
      this.cardList.classList.add("nodisp");
      return;
    }
    this.cardList.classList.remove("nodisp");
    for (const cardId of cardIds) {
      allCardIDs[cardId] = true;
    }
    for (const cardId in allCardIDs) {
      text += cardId + "\n";
    }

    this.cardList.innerHTML = text;
  }

  public UpdateDisplayedCards(): void {}
}

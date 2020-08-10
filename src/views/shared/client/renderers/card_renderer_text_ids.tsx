import { MiscOptions } from "../cardfilters/filter_misc_options";
import { MapData } from "../data_loader";
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
      this.cardList.addClass("nodisp");
      return;
    }
    this.cardList.removeClass("nodisp");
    for (const cardId of cardIds) {
      allCardIDs[cardId] = true;
    }
    for (const cardId in allCardIDs) {
      text += cardId + "\n";
    }

    this.cardList.text(text);
  }

  public UpdateDisplayedCards(): void {}
}

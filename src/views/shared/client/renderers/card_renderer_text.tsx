import { MiscOptions } from "../cardfilters/filter_misc_options";
import { BaseCardRenderer, Group, ActionHandler } from "./base_card_renderer";
import { DataLoader, MapData } from "../data_loader";

export class CardRendererText extends BaseCardRenderer {
  public groups: Group[];

  protected cardList!: JQuery<HTMLTextAreaElement>;

  public constructor(
    dataLoader: DataLoader,
    cardArea: JQuery,
    scrollingParent: JQuery,
    allowEdit: boolean,
    actionHandler: ActionHandler
  ) {
    super(dataLoader, cardArea, scrollingParent, allowEdit, actionHandler);
    this.groups = [];
  }

  public GetDisplayName(): string {
    return "Text";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return ["IDToName"];
  }

  public Initialize(): void {
    this.cardArea.addClass("text");
    // eslint-disable-next-line prettier/prettier
    this.cardList = $("<textarea readonly class=\"text\"/>");
    this.cardArea.append(this.cardList);
  }

  public Cleanup(): void {
    this.cardArea.removeClass("list");
    this.cardArea.empty();
  }

  public ChangeCardSet(cardIds: string[], _miscOptions: MiscOptions): void {
    if (!this.cardList) {
      return;
    }

    const nameToCount: { [name: string]: number } = {};
    const idToName = this.dl.getMapData("IDToName");
    if (!cardIds || cardIds.length === 0 || !idToName) {
      this.cardList.addClass("nodisp");
      return;
    }
    this.cardList.removeClass("nodisp");
    for (const cardId of cardIds) {
      const name = idToName[cardId];
      nameToCount[name] = nameToCount[name] || 0;
      nameToCount[name]++;
    }
    let text = "";
    for (const name in nameToCount) {
      const count = nameToCount[name];
      if (text.length) {
        text += "\n";
      }
      text += count + " " + name;
    }

    this.cardList.text(text);
  }

  public UpdateDisplayedCards(): void {}
}

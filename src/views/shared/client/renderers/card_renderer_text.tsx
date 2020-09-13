import { MiscOptions } from "../cardfilters/filter_misc_options";
import {
  BaseCardRenderer,
  Group,
  CardRendererOptions,
} from "./base_card_renderer";
import { MapData } from "../data_loader";

export class CardRendererText extends BaseCardRenderer {
  public groups: Group[];

  protected cardList!: HTMLTextAreaElement;

  public constructor(options: CardRendererOptions) {
    super(options);
    this.groups = [];
  }

  public GetDisplayName(): string {
    return "Text";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return ["IDToName"];
  }

  public Initialize(): void {
    this.cardArea.classList.add("text");
    this.cardList = document.createElement("textarea");
    this.cardList.classList.add("test");
    this.cardList.setAttribute("readonly", "true");
    this.cardArea.append(this.cardList);
  }

  public Cleanup(): void {
    this.cardArea.classList.remove("list");
    this.cardArea.innerHTML = "";
  }

  public ChangeCardSet(cardIds: string[], _miscOptions: MiscOptions): void {
    if (!this.cardList) {
      return;
    }

    const nameToCount: { [name: string]: number } = {};
    const idToName = this.dl.getMapData("IDToName");
    if (!cardIds || cardIds.length === 0 || !idToName) {
      this.cardList.classList.add("nodisp");
      return;
    }
    this.cardList.classList.remove("nodisp");
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

    this.cardList.innerHTML = text;
  }

  public UpdateDisplayedCards(): void {}
}

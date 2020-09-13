import { CardRendererOptions } from "./base_card_renderer";
import { CardRendererList } from "./card_renderer_list";

export class CardRendererCompactList extends CardRendererList {
  public constructor(options: CardRendererOptions) {
    super(options);
  }

  public GetDisplayName(): string {
    return "Compact " + super.GetDisplayName();
  }

  public Initialize(): void {
    this.cardArea.classList.add("compact");
    super.Initialize();
  }

  public Cleanup(): void {
    this.cardArea.classList.remove("compact");
    super.Cleanup();
  }
}

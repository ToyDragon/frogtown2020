import { CardRendererDetails } from "./card_renderer_details";
import { CardRendererOptions } from "./base_card_renderer";

export class CardRendererCompactDetails extends CardRendererDetails {
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

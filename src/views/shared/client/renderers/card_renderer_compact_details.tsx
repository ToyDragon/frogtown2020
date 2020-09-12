import { ActionHandler } from "./base_card_renderer";
import { CardRendererDetails } from "./card_renderer_details";
import { DataLoader } from "../data_loader";

export class CardRendererCompactDetails extends CardRendererDetails {
  public constructor(
    dataLoader: DataLoader,
    cardArea: HTMLElement,
    scrollingParent: HTMLElement,
    allowEdit: boolean,
    actionHandler: ActionHandler
  ) {
    super(dataLoader, cardArea, scrollingParent, allowEdit, actionHandler);
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

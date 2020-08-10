import { ActionHandler } from "./base_card_renderer";
import { CardRendererDetails } from "./card_renderer_details";
import { DataLoader } from "../data_loader";

export class CardRendererCompactDetails extends CardRendererDetails {
  public constructor(
    dataLoader: DataLoader,
    cardArea: JQuery,
    scrollingParent: JQuery,
    allowEdit: boolean,
    actionHandler: ActionHandler
  ) {
    super(dataLoader, cardArea, scrollingParent, allowEdit, actionHandler);
  }

  public GetDisplayName(): string {
    return "Compact " + super.GetDisplayName();
  }

  public Initialize(): void {
    this.cardArea.addClass("compact");
    super.Initialize();
  }

  public Cleanup(): void {
    this.cardArea.removeClass("compact");
    super.Cleanup();
  }
}

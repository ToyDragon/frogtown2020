import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import { DataLoader } from "../shared/client/data_loader";
import {
  BaseCardRenderer,
  CardRendererOptions,
} from "../shared/client/renderers/base_card_renderer";
import { CardRendererCompactGrid } from "../shared/client/renderers/card_renderer_compact_grid";
import { CardRendererDetails } from "../shared/client/renderers/card_renderer_details";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRendererList } from "../shared/client/renderers/card_renderer_list";
import { CardRendererText } from "../shared/client/renderers/card_renderer_text";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";
import ViewBehavior from "../shared/client/view_behavior";
import { DeckViewerIncludedData } from "./types";

export class altArtPane extends ViewBehavior<DeckViewerIncludedData> {
  private altPane: HTMLElement = document.querySelector(
    "altPane"
  ) as HTMLElement;
  private cardSearchUtil = new CardSearchBehavior(
    this.dl,
    (cardIds: string[], _miscOptions: MiscOptions) => {
      this.altPaneRenderArea.UpdateCardList(cardIds);
    }
  );

  private defaultAltPaneOptions: MiscOptions = {
    "Show Duplicates": false,
    "Stack Duplicates": false,
    "Action Add": true,
    "Action Remove": true,
    "Action To Sideboard": true,
    "Action Similar": true,
    "Action Star": true,
  };

  private altPaneOptions: CardRendererOptions = {
    dataLoader: this.dl,
    cardArea: this.altPane,
    scrollingParent: this.altPane,
    allowEdit: false,
    actionHandler: (action: string, cardId: string) => {
      this.onSearchAction(action, cardId);
    },
  };

  private baseRenderList: BaseCardRenderer[] = [
    new CardRendererGrid(this.altPaneOptions),
    new CardRendererList(this.altPaneOptions),
    new CardRendererDetails(this.altPaneOptions),
    new CardRendererCompactGrid(this.altPaneOptions),
    new CardRendererText(this.altPaneOptions),
  ];

  private altPaneRenderArea = new CardRenderArea(
    new DataLoader(null),
    this.baseRenderList,
    "altpanegroupers",
    "altpanedisplay",
    this.defaultAltPaneOptions,
    null,
    "AltPaneCards"
  );
}

export function altPaneInit(): void {
  document.getElementById("exitIcon")?.addEventListener("click", function () {
    document.getElementById("altPane")!.style.visibility = "hidden";
  });
  return;
}

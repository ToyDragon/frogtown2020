import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import {
  BaseCardRenderer,
  CardRendererOptions,
} from "../shared/client/renderers/base_card_renderer";
import { CardRendererCompactDetails } from "../shared/client/renderers/card_renderer_compact_details";
import { CardRendererCompactGrid } from "../shared/client/renderers/card_renderer_compact_grid";
import { CardRendererCompactList } from "../shared/client/renderers/card_renderer_compact_list";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";
import ViewBehavior from "../shared/client/view_behavior";

export class AlternateArtPane extends ViewBehavior<unknown> {
  private altPaneRenderArea: CardRenderArea;
  searchOptions: CardRendererOptions = {
    dataLoader: this.dl,
    cardArea: document.getElementById("altContainer")!,
    scrollingParent: document.getElementById("altPane")!,
    allowEdit: false,
    actionHandler: (action: string, cardId: string) => {
      return action + cardId;
    },
  };
  defaultSearchOptions: MiscOptions = {
    "Action Add": true,
    "Action Similar": true,
  };
  cardRenderers: BaseCardRenderer[] = [
    new CardRendererGrid(this.searchOptions),
    new CardRendererCompactList(this.searchOptions),
    new CardRendererCompactDetails(this.searchOptions),
    new CardRendererCompactGrid(this.searchOptions),
  ];
  cardSearchUtil = new CardSearchBehavior(
    this.dl,
    (cardIds: string[], _miscOptions: MiscOptions) => {
      this.altPaneRenderArea.UpdateCardList(cardIds);
    }
  );

  constructor() {
    super();

    document.getElementById("exitIcon")?.addEventListener("click", function () {
      document.getElementById("altPane")!.style.visibility = "hidden";
    });

    this.altPaneRenderArea = new CardRenderArea(
      this.dl,
      this.cardRenderers,
      "",
      "carddisplay",
      this.defaultSearchOptions,
      this.cardSearchUtil,
      ""
    );
  }

  updateCards(): void {
    this.altPaneRenderArea.UpdateDisplayedCards();
  }

  open(cardID: string): void {
    document.getElementById("altPane")!.style.visibility = "visible";
    this.updateCards();
    this.renderAltArts(cardID);
  }

  applyFilters(): void {
    console.log("Applying filters");
  }

  renderAltArts(cardID: string): void {
    console.log("Rendering alternate artwork for cardID: " + cardID);
  }

  replaceAll(cardID: string): void {
    console.log("Replacing all artworks for cardID: " + cardID);
  }
}

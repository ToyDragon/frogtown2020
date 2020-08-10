import ViewBehavior from "../shared/client/view_behavior";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import { BaseCardRenderer } from "../shared/client/renderers/base_card_renderer";
import { CardRendererList } from "../shared/client/renderers/card_renderer_list";
import { CardRendererDetails } from "../shared/client/renderers/card_renderer_details";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";
import { CardRendererText } from "../shared/client/renderers/card_renderer_text";
import { CardRendererTextIDs } from "../shared/client/renderers/card_renderer_text_ids";
import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";

class CardSearchViewBehavior extends ViewBehavior {
  private cardSearchUtil: CardSearchBehavior | null = null;

  public async ready(): Promise<void> {
    this.dl.startLoading(["IDToName", "IDToText"]);

    const onCardAction = (action: string, cardId: string) => {
      this.onCardAction(action, cardId);
    };
    const cardArea = $("#cardArea");
    const scrollingParent = $("#cardSearch");
    const allRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(
        this.dl,
        cardArea,
        scrollingParent,
        false,
        onCardAction
      ),
      new CardRendererList(
        this.dl,
        cardArea,
        scrollingParent,
        false,
        onCardAction
      ),
      new CardRendererDetails(
        this.dl,
        cardArea,
        scrollingParent,
        false,
        onCardAction
      ),
      new CardRendererText(
        this.dl,
        cardArea,
        scrollingParent,
        false,
        onCardAction
      ),
    ];

    // TODO
    // if (Utils.IsDebug()) {
    allRenderers.push(
      new CardRendererTextIDs(
        this.dl,
        cardArea,
        scrollingParent,
        false,
        onCardAction
      )
    );
    // }

    this.cardSearchUtil = new CardSearchBehavior(
      this.dl,
      (cardIds, _miscOptions) => {
        deckRenderArea.UpdateCardList(cardIds);
      }
    );

    const defaultOptions: MiscOptions = {
      "Action Similar": true,
    };
    const deckRenderArea = new CardRenderArea(
      this.dl,
      allRenderers,
      "",
      "carddisplay",
      defaultOptions,
      this.cardSearchUtil,
      ""
    );

    setInterval(() => {
      deckRenderArea.UpdateDisplayedCards();
    }, 250);
  }

  private onCardAction(action: string, cardId: string) {
    if (!this.cardSearchUtil) {
      return;
    }

    if (action === "add") {
      // Intentionally blank
    } else if (action === "remove") {
      // Intentionally blank
    } else if (action === "similar") {
      console.log("looking for similar cards");
      $("#filterSelection > div > ul > li[data-active=true]").trigger("click");
      $("#filterSelection > div > ul > li[data-filtertype=misc]").trigger(
        "click"
      );

      const idToName = this.dl.getMapData("IDToName");
      if (!idToName) {
        return;
      }

      this.cardSearchUtil.GetNameFilter().setValue(idToName[cardId]);
      this.cardSearchUtil.GetMiscFilter().setValue(["Show Duplicates"]);
      this.cardSearchUtil.ApplyFilter();
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new CardSearchViewBehavior();
behavior;

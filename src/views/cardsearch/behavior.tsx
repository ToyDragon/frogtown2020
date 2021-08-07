import ViewBehavior from "../shared/client/view_behavior";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import {
  BaseCardRenderer,
  CardRendererOptions,
} from "../shared/client/renderers/base_card_renderer";
import { CardRendererList } from "../shared/client/renderers/card_renderer_list";
import { CardRendererDetails } from "../shared/client/renderers/card_renderer_details";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";
import { CardRendererText } from "../shared/client/renderers/card_renderer_text";
import { CardRendererTextIDs } from "../shared/client/renderers/card_renderer_text_ids";
import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";

class CardSearchViewBehavior extends ViewBehavior<unknown> {
  private cardSearchUtil: CardSearchBehavior | null = null;

  public async ready(): Promise<void> {
    this.dl.startLoading(["IDToName", "IDToText"]);
    const cardArea = document.querySelector("#cardArea") as HTMLElement;
    const scrollingParent = document.querySelector(
      "#cardSearch"
    ) as HTMLElement;
    const searchOptions: CardRendererOptions = {
      dataLoader: this.dl,
      cardArea: cardArea,
      scrollingParent: scrollingParent,
      allowEdit: false,
      actionHandler: (action: string, cardId: string) => {
        this.onCardAction(action, cardId);
      },
    };
    const allRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(searchOptions),
      new CardRendererList(searchOptions),
      new CardRendererDetails(searchOptions),
      new CardRendererText(searchOptions),
    ];

    // TODO
    // if (Utils.IsDebug()) {
    allRenderers.push(new CardRendererTextIDs(searchOptions));
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
      (document.querySelectorAll(
        "#filterSelection > div > ul > li[data-active=true]"
      ) as NodeListOf<HTMLElement> | null)?.forEach((element) => {
        element.click();
      });
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

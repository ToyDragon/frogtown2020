import ViewBehavior from "../shared/client/view_behavior";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import { post } from "../shared/client/request";
import {
  DeckViewerChangeMetadata,
  DeckViewerIncludedData,
  DeckViewerSaveDeck,
} from "./types";
import {
  BaseCardRenderer,
  CardRendererOptions,
} from "../shared/client/renderers/base_card_renderer";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRendererText } from "../shared/client/renderers/card_renderer_text";
import { CardRendererCompactGrid } from "../shared/client/renderers/card_renderer_compact_grid";
import { CardRendererDetails } from "../shared/client/renderers/card_renderer_details";
import { CardRendererList } from "../shared/client/renderers/card_renderer_list";
import { CardRendererTextIDs } from "../shared/client/renderers/card_renderer_text_ids";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";
import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";
import { CardRendererCompactDetails } from "../shared/client/renderers/card_renderer_compact_details";
import { CardRendererCompactList } from "../shared/client/renderers/card_renderer_compact_list";
import TableTopSimulator from "../shared/client/exporter/tabletop_simulator";
import Debouncer from "../shared/debouncer";
import setupBulkImport from "./action_bulkimport";
import setupDelete from "./action_delete";
import setupEditName from "./action_editname";
import setupSearchArrow from "./search_arrow";
import { GetImageUrl } from "../shared/client/utils";
import { AlternateArtPane } from "./alternate_art_popup_pane";

class DeckViewerViewBehavior extends ViewBehavior<DeckViewerIncludedData> {
  private cardSearchUtil: CardSearchBehavior | null = null;

  private mainboardArea!: HTMLElement;
  private deckScrollingParent!: HTMLElement;
  private mainboardRenderArea!: CardRenderArea;

  private sideboardArea!: HTMLElement;
  private sideboardRenderArea!: CardRenderArea;

  private searchRenderArea!: CardRenderArea;
  private cardArea!: HTMLElement;
  private cardScrollingParent!: HTMLElement;
  private saveDebouncer = new Debouncer(500);
  private tableTopSimulator!: TableTopSimulator;
  private altPane = new AlternateArtPane(this.dl);

  public async ready(): Promise<void> {
    if (!this.getIncludedData()?.deckDetails?.id) {
      //Deck was likely deleted
      window.location.replace("/cardsearch.html");
    }
    this.tableTopSimulator = new TableTopSimulator(this.dl);

    this.mainboardArea = document.querySelector("#mainboard") as HTMLElement;
    this.sideboardArea = document.querySelector("#sideboard") as HTMLElement;
    this.cardArea = document.querySelector("#cardArea") as HTMLElement;
    this.cardScrollingParent = document.querySelector(
      "#cardSearch"
    ) as HTMLElement;

    this.deckScrollingParent = document.querySelector(
      "#deckArea"
    ) as HTMLElement;

    const viewOthersBtn = document.querySelector("#actionViewOtherDecks");

    // Edit permissions
    const allowEdit =
      this.getIncludedData().deckDetails.ownerId ===
      this.authSession.user.publicId;
    if (allowEdit) {
      viewOthersBtn?.classList.add("nodisp");
    }

    this.dl.startLoading(["IDToName", "IDToText"]);

    // View other decks by this user
    viewOthersBtn?.addEventListener("click", () => {
      window.location.replace(
        "/mydecks/" + this.getIncludedData().deckDetails.ownerId + ".html"
      );
    });

    // Delete deck popup
    setupDelete(allowEdit, this.getIncludedData().deckDetails.id);

    // Clone deck action
    document
      .querySelector("#actionClone")
      ?.addEventListener("click", async () => {
        const data = await post(
          "/deckViewer/cloneDeck/" + this.getIncludedData().deckDetails.id,
          {}
        );
        window.location.replace(`/deckViewer/${data}/edit.html`);
      });

    // Bulk import popup
    setupBulkImport(this.dl, (cardId) => {
      this.onSearchAction("add", cardId);
    });

    // Export to TTS
    this.updateTTSLink();
    this.tableTopSimulator.ready.then(() => {
      this.updateTTSLink();
    });

    // Card search
    this.cardSearchUtil = new CardSearchBehavior(
      this.dl,
      (cardIds: string[], _miscOptions: MiscOptions) => {
        this.searchRenderArea.UpdateCardList(cardIds);
      }
    );

    const mainboardOptions: CardRendererOptions = {
      dataLoader: this.dl,
      cardArea: this.mainboardArea,
      scrollingParent: this.deckScrollingParent,
      allowEdit: allowEdit,
      actionHandler: (action: string, cardId: string) => {
        this.onSearchAction(action, cardId);
      },
    };
    const deckRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(mainboardOptions),
      new CardRendererList(mainboardOptions),
      new CardRendererDetails(mainboardOptions),
      new CardRendererCompactGrid(mainboardOptions),
      new CardRendererText(mainboardOptions),
    ];
    //TODO
    //if (Utils.IsDebug()) {
    deckRenderers.push(new CardRendererTextIDs(mainboardOptions));
    //}

    const defaultDeckOptions: MiscOptions = {
      "Show Duplicates": true,
      "Stack Duplicates": true,
      "Action Add": true,
      "Action Remove": true,
      "Action To Sideboard": true,
      "Action Similar": true,
      "Action Star": true,
    };

    this.mainboardRenderArea = new CardRenderArea(
      this.dl,
      deckRenderers,
      "deckgroupers",
      "deckdisplay",
      defaultDeckOptions,
      null,
      "DeckViewerDeck"
    );

    this.updateSideboardTitle();

    const sideboardOptions: CardRendererOptions = {
      dataLoader: this.dl,
      cardArea: this.sideboardArea,
      scrollingParent: this.deckScrollingParent,
      allowEdit: allowEdit,
      actionHandler: (action: string, cardId: string) => {
        this.onSideboardAction(action, cardId);
      },
    };
    const sideboardRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(sideboardOptions),
      new CardRendererList(sideboardOptions),
      new CardRendererDetails(sideboardOptions),
      new CardRendererCompactGrid(sideboardOptions),
      new CardRendererText(sideboardOptions),
    ];

    //TODO
    //if (Utils.IsDebug()) {
    sideboardRenderers.push(new CardRendererTextIDs(sideboardOptions));
    //}

    const defaultSideboardOptions: MiscOptions = {
      "Show Duplicates": true,
      "Stack Duplicates": true,
      "Action Add": true,
      "Action Remove": true,
      "Action To Mainboard": true,
      "Action Similar": true,
      "Action Star": true,
    };
    this.sideboardRenderArea = new CardRenderArea(
      this.dl,
      sideboardRenderers,
      "deckgroupers",
      "deckdisplay",
      defaultSideboardOptions,
      null,
      "DeckViewerDeck"
    );

    const searchOptions: CardRendererOptions = {
      dataLoader: this.dl,
      cardArea: this.cardArea,
      scrollingParent: this.cardScrollingParent,
      allowEdit: allowEdit,
      actionHandler: (action: string, cardId: string) => {
        this.onSearchAction(action, cardId);
      },
    };
    const cardRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(searchOptions),
      new CardRendererCompactList(searchOptions),
      new CardRendererCompactDetails(searchOptions),
      new CardRendererCompactGrid(searchOptions),
    ];
    const defaultSearchOptions: MiscOptions = {
      "Action Add": true,
      "Action Similar": true,
    };
    this.searchRenderArea = new CardRenderArea(
      this.dl,
      cardRenderers,
      "",
      "carddisplay",
      defaultSearchOptions,
      this.cardSearchUtil,
      ""
    );

    setInterval(() => {
      this.updateCardDivs();
    }, 250);
    this.updateCardDivs();

    setupEditName(
      () => {
        return this.getIncludedData().deckDetails;
      },
      () => {
        this.updateTitle();
      }
    );
    this.updateTitle();

    // Update immediately in case the user changes the active renderer before the assigned renderer is ready.
    this.mainboardRenderArea.UpdateCardList(
      this.getIncludedData().deckDetails.mainboard
    );
    this.sideboardRenderArea.UpdateCardList(
      this.getIncludedData().deckDetails.sideboard
    );

    // Update when the required maps are loaded for the assigned renderer
    this.dl
      .onAllLoaded(this.mainboardRenderArea.activeRenderer.GetRequiredMaps())
      .then(() => {
        this.mainboardRenderArea.UpdateCardList(
          this.getIncludedData().deckDetails.mainboard
        );
        this.sideboardRenderArea.UpdateCardList(
          this.getIncludedData().deckDetails.sideboard
        );
      });

    setupSearchArrow(() => {
      return this.getIncludedData().deckDetails;
    });

    this.updateKeyCardDisplay();
    // Alternate art pane initialization
  }

  private updateCardDivs(): void {
    this.searchRenderArea.UpdateDisplayedCards();
    this.mainboardRenderArea.UpdateDisplayedCards();
    this.sideboardRenderArea.UpdateDisplayedCards();
  }

  private onSearchAction(action: string, cardId: string): void {
    const deckDetails = this.getIncludedData().deckDetails;
    if (action === "add") {
      deckDetails.mainboard.push(cardId);
      deckDetails.mainboard = deckDetails.mainboard.sort();
      this.mainboardRenderArea.UpdateCardList(deckDetails.mainboard);
      console.log(`adding card ${cardId} to mainboard`);
      this.saveDeckChange();
    } else if (action === "remove") {
      for (let i = 0; i < deckDetails.mainboard.length; i++) {
        const otherCardId = deckDetails.mainboard[i];
        if (otherCardId === cardId) {
          deckDetails.mainboard.splice(i, 1);
          break;
        }
      }
      this.mainboardRenderArea.UpdateCardList(deckDetails.mainboard);
      console.log(`removing card ${cardId} from mainboard`);
      this.saveDeckChange();
    } else if (action === "similar") {
      console.log("looking for similar cards");
      (document.querySelector(
        "#filterSelection > div > ul > li[data-active=true]"
      ) as HTMLElement | null)?.click();
      (document.querySelector(
        "#filterSelection > div > ul > li[data-filtertype=misc]"
      ) as HTMLElement | null)?.click();

      this.cardSearchUtil!.GetNameFilter().setValue(
        this.dl.getMapData("IDToName")![cardId]
      );
      this.cardSearchUtil!.GetMiscFilter().setValue(["Show Duplicates"]);
      this.cardSearchUtil!.ApplyFilter();
      this.altPane.open(cardId);
      this.altPane.applyFilters();
    } else if (action === "tosideboard") {
      this.onSideboardAction("add", cardId);
      this.onSearchAction("remove", cardId);
      this.saveDeckChange();
    } else if (action === "star") {
      this.updateKeyCard(cardId);
    }
    this.updateTitle();
  }

  private updateTitle(): void {
    const deetz = this.getIncludedData().deckDetails;
    document.querySelector(".deckName")!.innerHTML =
      deetz.name +
      " (" +
      (deetz.mainboard.length + deetz.sideboard.length) +
      " cards)";
  }

  private async saveDeckChange(): Promise<void> {
    const deetz = this.getIncludedData().deckDetails;
    deetz.cardCount = deetz.mainboard.length + deetz.sideboard.length;
    const seenColors: Record<string, boolean> = {};
    const idToColorMap = this.dl.getMapData("IDToColor");
    if (!idToColorMap) {
      return;
    }
    for (const cardId of deetz.mainboard) {
      const colors = idToColorMap[cardId];
      if (colors) {
        for (const color of colors) {
          seenColors[color] = true;
        }
      }
    }
    deetz.colors = [];
    seenColors["W"] && deetz.colors.push("white");
    seenColors["U"] && deetz.colors.push("blue");
    seenColors["B"] && deetz.colors.push("black");
    seenColors["R"] && deetz.colors.push("red");
    seenColors["G"] && deetz.colors.push("green");
    this.tbController.setDeckCardsAndColors(
      deetz.id,
      deetz.cardCount,
      deetz.colors
    );
    if (await this.saveDebouncer.waitAndShouldAct()) {
      this.updateTTSLink();
      console.log("Saving");
      const response = await post<DeckViewerSaveDeck, string>(
        "/deckViewer/updateCards",
        {
          deckId: deetz.id,
          mainboard: deetz.mainboard,
          sideboard: deetz.sideboard,
          cardCount: deetz.cardCount,
          colors: deetz.colors,
        }
      );
      console.log(response);
    }
  }

  private onSideboardAction(action: string, cardId: string) {
    const deckDetails = this.getIncludedData().deckDetails;
    if (action === "add") {
      deckDetails.sideboard.push(cardId);
      deckDetails.sideboard = deckDetails.sideboard.sort();
      this.sideboardRenderArea.UpdateCardList(deckDetails.sideboard);
      this.saveDeckChange();
      this.updateSideboardTitle();
    } else if (action === "remove") {
      for (let i = 0; i < deckDetails.sideboard.length; i++) {
        const otherCardId = deckDetails.sideboard[i];
        if (otherCardId === cardId) {
          deckDetails.sideboard.splice(i, 1);
          break;
        }
      }
      this.sideboardRenderArea.UpdateCardList(deckDetails.sideboard);
      this.saveDeckChange();
      this.updateSideboardTitle();
    } else if (action === "similar") {
      this.onSearchAction(action, cardId);
    } else if (action === "tomainboard") {
      this.onSideboardAction("remove", cardId);
      this.onSearchAction("add", cardId);
      this.saveDeckChange();
      this.updateSideboardTitle();
    } else if (action === "star") {
      this.updateKeyCard(cardId);
    }
    this.updateTitle();
  }

  private async updateKeyCardDisplay(): Promise<void> {
    if (this.dl.dataDetails && this.getIncludedData().deckDetails.keyCard) {
      document.getElementById("favoriteCard")!.style.backgroundImage =
        "url(" +
        GetImageUrl(
          this.getIncludedData().deckDetails.keyCard,
          this.dl.dataDetails
        ) +
        ")";
      this.tbController.setDeckKeyCard(
        this.getIncludedData().deckDetails.id,
        this.getIncludedData().deckDetails.keyCard
      );
    }
  }

  private async updateKeyCard(cardId: string): Promise<void> {
    this.getIncludedData().deckDetails.keyCard = cardId;
    this.updateKeyCardDisplay();
    await post<DeckViewerChangeMetadata, boolean>(
      "/deckViewer/updateMetadata",
      {
        deckId: this.getIncludedData().deckDetails.id,
        name: null,
        keyCard: cardId,
      }
    );
  }

  private updateSideboardTitle(): void {
    const sideboardTitle = document.querySelector(".boardTitle.sideboard");
    if (sideboardTitle) {
      if (this.getIncludedData().deckDetails.sideboard.length) {
        sideboardTitle.classList.remove("nodisp");
      } else {
        sideboardTitle.classList.add("nodisp");
      }
    }
  }

  private updateTTSLink(): void {
    const btnExportTTS = document.querySelector("#actionExportTTS");
    if (!btnExportTTS) {
      return;
    }

    const deckJSON = this.tableTopSimulator.exportDeck(
      this.getIncludedData().deckDetails
    );
    btnExportTTS.innerHTML = "Download Tabletop Simulator Deck";
    btnExportTTS.setAttribute(
      "href",
      "data:text/json," + encodeURIComponent(deckJSON)
    );
    btnExportTTS.setAttribute(
      "download",
      this.getIncludedData().deckDetails.name + ".json"
    );
  }
}

// Expose behavior to the window for easier debugging.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).behavior = new DeckViewerViewBehavior();

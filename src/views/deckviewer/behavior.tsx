import ViewBehavior from "../shared/client/view_behavior";
import { CardSearchBehavior } from "../shared/client/cardsearch_behavior";
import { post, get } from "../shared/client/request";
import { DeckViewerIncludedData, DeckViewerSaveDeck } from "./types";
import { BaseCardRenderer } from "../shared/client/renderers/base_card_renderer";
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
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable-next-line node/no-unpublished-require */
const rough = require("../../../node_modules/roughjs/bundled/rough.cjs.js");
/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable-next-line node/no-unpublished-require */

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

  private editingName = false;
  private saveDelay = 500;
  private latestChange: Date | null = null;
  private deckSaveWaiting = false;

  public async ready(): Promise<void> {
    //TODO handle no included data about deck
    /*
    if(!includedData.deckDetails){
      //Deck was likely deleted
      window.location.replace("/cardsearch.html");
    }
    */

    this.mainboardArea = document.querySelector("#mainboard") as HTMLElement;
    this.sideboardArea = document.querySelector("#sideboard") as HTMLElement;
    this.cardArea = document.querySelector("#cardArea") as HTMLElement;
    this.cardScrollingParent = document.querySelector(
      "#cardSearch"
    ) as HTMLElement;

    this.deckScrollingParent = document.querySelector(
      "#deckArea"
    ) as HTMLElement;

    // Edit permissions
    let allowEdit = false;
    if (
      this.getIncludedData().deckDetails.ownerId !==
      this.authSession.user.publicId
    ) {
      $("#actionDelete").addClass("nodisp");
    } else {
      $("#actionViewOtherDecks").addClass("nodisp");
      allowEdit = true;
    }

    this.dl.startLoading(["IDToName", "IDToText"]);

    // View other decks by this user
    document
      .querySelector("#actionViewOtherDecks")
      ?.addEventListener("click", () => {
        window.location.replace(
          "/mydecks/" + this.getIncludedData().deckDetails.ownerId + ".html"
        );
      });

    // Delete deck popup
    document.querySelector("#actionDelete")?.addEventListener("click", () => {
      this.showPopup(document.querySelector("#deleteOverlay"));
    });
    document
      .querySelector("#btnCloseDeletePopup")
      ?.addEventListener("click", () => {
        document.querySelector("#deleteOverlay")?.classList.add("nodisp");
      });
    document
      .querySelector("#btnConfirmDelete")
      ?.addEventListener("click", async () => {
        document.querySelector("#deleteOverlay")?.classList.add("nodisp");
        await post(
          "/deckViewer/deleteDeck/" + this.getIncludedData().deckDetails.id,
          {}
        );
        window.location.replace("/cardsearch.html");
      });

    // Clone deck action
    document
      .querySelector("#actionClone")
      ?.addEventListener("click", async () => {
        const data = await post(
          "/deckViewer/cloneDeck/" + this.getIncludedData().deckDetails.id,
          {}
        );
        window.location.replace("/deckViewer/" + data + "/edit.html");
      });

    // Bulk import popup
    document
      .querySelector("#actionBulkImport")
      ?.addEventListener("click", () => {
        const inputArea = document.querySelector(
          "#bulkInputArea"
        ) as HTMLTextAreaElement;
        inputArea.value = "";
        const inputAreaError = document.querySelector(
          "#bulkInputErr"
        ) as HTMLHeadingElement;
        inputAreaError.textContent = "";
        this.showPopup(document.querySelector("#importOverlay"));
      });
    document
      .querySelector("#btnConfirmImport")
      ?.addEventListener("click", () => {
        const inputArea = document.querySelector(
          "#bulkInputArea"
        ) as HTMLTextAreaElement;
        const result = this.getCardsByName(inputArea.value);
        const inputAreaError = document.querySelector(
          "#bulkInputErr"
        ) as HTMLHeadingElement;
        if (result.errors.length) {
          inputAreaError.textContent = "Can't find " + result.errors.join(", ");
        } else {
          for (const cardId of result.ids) {
            this.onSearchAction("add", cardId);
          }
          document.querySelector("#importOverlay")?.classList.add("nodisp");
        }
      });
    document
      .querySelector("#btnCloseImportPopup")
      ?.addEventListener("click", () => {
        document.querySelector("#importOverlay")?.classList.add("nodisp");
      });

    // Export to TTS
    this.updateTTSLink();
    document
      .querySelector("#actionExportTTS")
      ?.addEventListener("click", async (e) => {
        const liTTSExport = document.querySelector(
          "#liTTSExport"
        ) as HTMLLIElement;
        const btnExportTTS = document.querySelector(
          "#actionExportTTS"
        ) as HTMLElement;
        if (
          !this.getIncludedData().deckDetails.ttsLink &&
          !liTTSExport.getAttribute("disabled") &&
          btnExportTTS.getAttribute("href") === "#"
        ) {
          liTTSExport.setAttribute("disabled", "true");
          $("#actionExportTTS").text("Generating TTS files...");
          console.log("Requesting export.");
          e.preventDefault();
          e.stopPropagation();

          const link = await post<unknown, string>(
            "/deckViewer/export/tts/" + this.getIncludedData().deckDetails.id,
            {}
          );
          console.log("Export finished: " + link);
          if (link) {
            this.getIncludedData().deckDetails.ttsLink = link;
            liTTSExport.removeAttribute("disabled");
            this.updateTTSLink();
          }
        }
      });

    // Card search
    const deckRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererList(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererDetails(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererCompactGrid(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererText(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
    ];

    //TODO
    //if (Utils.IsDebug()) {
    deckRenderers.push(
      new CardRendererTextIDs(
        this.dl,
        this.mainboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      )
    );
    //}

    const defaultDeckOptions: MiscOptions = {
      "Show Duplicates": true,
      "Stack Duplicates": true,
      "Action Add": true,
      "Action Remove": true,
      "Action To Sideboard": true,
      "Action Similar": true,
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

    const sideboardRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      ),
      new CardRendererList(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      ),
      new CardRendererDetails(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      ),
      new CardRendererCompactGrid(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      ),
      new CardRendererText(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      ),
    ];

    //TODO
    //if (Utils.IsDebug()) {
    sideboardRenderers.push(
      new CardRendererTextIDs(
        this.dl,
        this.sideboardArea,
        this.deckScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSideboardAction(action, cardId);
        }
      )
    );
    //}

    const defaultSideboardOptions: MiscOptions = {
      "Show Duplicates": true,
      "Stack Duplicates": true,
      "Action Add": true,
      "Action Remove": true,
      "Action To Mainboard": true,
      "Action Similar": true,
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

    const cardRenderers: BaseCardRenderer[] = [
      new CardRendererGrid(
        this.dl,
        this.cardArea,
        this.cardScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererCompactList(
        this.dl,
        this.cardArea,
        this.cardScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererCompactDetails(
        this.dl,
        this.cardArea,
        this.cardScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
      new CardRendererCompactGrid(
        this.dl,
        this.cardArea,
        this.cardScrollingParent,
        allowEdit,
        (action: string, cardId: string) => {
          this.onSearchAction(action, cardId);
        }
      ),
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

    this.cardSearchUtil = new CardSearchBehavior(
      this.dl,
      (cardIds: string[], _miscOptions: MiscOptions) => {
        this.searchRenderArea.UpdateCardList(cardIds);
      }
    );

    const nameEntry = document.querySelector("#nameEntry") as HTMLInputElement;
    const actionNameChange = document.querySelector(
      "#actionChangeName"
    ) as HTMLElement;
    const nameDisplay = document.querySelector(
      "#mainNameDisplay"
    ) as HTMLElement;
    nameDisplay.innerText = this.getIncludedData().deckDetails.name;
    const doneEditingName = () => {
      if (this.saveNameChange()) {
        nameEntry.classList.add("nodisp");
        nameDisplay.classList.remove("nodisp");
        this.editingName = false;
      }
    };
    nameEntry.addEventListener("keydown", (e) => {
      if (e.keyCode === 13) {
        doneEditingName();
      }
    });
    actionNameChange.addEventListener("click", () => {
      if (this.editingName) {
        doneEditingName();
      } else {
        nameEntry.classList.remove("nodisp");
        nameEntry.value = this.getIncludedData().deckDetails.name;
        nameEntry.focus();
        nameDisplay.classList.add("nodisp");
        this.editingName = true;
      }
    });

    this.drawArrow();
    setInterval(() => {
      this.drawArrow();
    }, 125);

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
  }

  private drawArrow(): void {
    const searchSvg = document.querySelector("#searchSVG") as SVGSVGElement;
    searchSvg.innerHTML = "";
    let numCards = 0;

    numCards += this.getIncludedData().deckDetails.mainboard.length;
    numCards += this.getIncludedData().deckDetails.sideboard.length;

    if (numCards === 0) {
      const rc = rough.svg(searchSvg);
      const startX = 150;
      const startY = 15;
      const width = 250;
      const height = 420;
      const points = [
        [startX + width / 3, startY + height],
        [startX + width / 3, startY + height / 4],
        [startX, startY + height / 4],
        [startX + width / 2, startY],
        [startX + width, startY + height / 4],
        [startX + (2 * width) / 3, startY + height / 4],
        [startX + (2 * width) / 3, startY + height],
      ];

      for (let i = 0; i < points.length; i++) {
        const ni = (i + 1) % points.length;

        const l = points[i];
        const r = points[ni];
        const ele = rc.line(l[0], l[1], r[0], r[1], {
          bowing: 3,
          stroke: "#303b4c",
          strokeWidth: 3,
        });
        searchSvg.append(ele);
      }
    }
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
      console.log("adding card " + cardId + " to mainboard");
      this.queueSaveDeckChange();
    } else if (action === "remove") {
      for (let i = 0; i < deckDetails.mainboard.length; i++) {
        const otherCardId = deckDetails.mainboard[i];
        if (otherCardId === cardId) {
          deckDetails.mainboard.splice(i, 1);
          break;
        }
      }
      this.mainboardRenderArea.UpdateCardList(deckDetails.mainboard);
      console.log("removing card " + cardId + " from mainboard");
      this.queueSaveDeckChange();
    } else if (action === "similar") {
      console.log("looking for similar cards");
      $("#filterSelection > div > ul > li[data-active=true]").trigger("click");
      $("#filterSelection > div > ul > li[data-filtertype=misc]").trigger(
        "click"
      );

      this.cardSearchUtil!.GetNameFilter().setValue(
        this.dl.getMapData("IDToName")![cardId]
      );
      this.cardSearchUtil!.GetMiscFilter().setValue(["Show Duplicates"]);
      this.cardSearchUtil!.ApplyFilter();
    } else if (action === "tosideboard") {
      this.onSideboardAction("add", cardId);
      this.onSearchAction("remove", cardId);
      this.queueSaveDeckChange();
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

  private saveNameChange(): boolean {
    const errorDisplay = document.querySelector(
      "#divNameErr"
    ) as HTMLDivElement;
    const nameEntry = document.querySelector("#nameEntry") as HTMLInputElement;
    const newName = (nameEntry.value + "").trim();
    if (newName.length < 100 && newName.length > 0) {
      errorDisplay.classList.add("nodisp");
      this.getIncludedData().deckDetails.name = newName;
      this.updateTitle();
      post<unknown, unknown>(
        "/deckViewer/changeName/" +
          this.getIncludedData().deckDetails.id +
          "/" +
          encodeURIComponent(newName),
        {}
      );
      return true;
    } else {
      errorDisplay.classList.remove("nodisp");
      return false;
    }
  }

  private async queueSaveDeckChange(): Promise<void> {
    this.latestChange = new Date();
    if (!this.deckSaveWaiting) {
      this.deckSaveWaiting = true;
      console.log("Queueing save");
      setTimeout(() => {
        this.saveDeckChange();
      }, this.saveDelay);
    } else {
      console.log("Not queueing save, already queued");
    }
  }

  private async saveDeckChange(): Promise<void> {
    if (!this.latestChange) {
      return;
    }
    const remainingTime =
      this.latestChange.getTime() + this.saveDelay - new Date().getTime();
    if (remainingTime > 0) {
      console.log("Waiting " + remainingTime + " to save");
      setTimeout(() => {
        this.saveDeckChange();
      }, remainingTime);
    } else {
      const deetz = this.getIncludedData().deckDetails;
      deetz.ttsLink = "";
      this.updateTTSLink();
      console.log("Saving");
      this.deckSaveWaiting = false;
      const response = await post<DeckViewerSaveDeck, string>(
        "/deckViewer/updateCards",
        {
          deckId: deetz.id,
          mainboard: deetz.mainboard,
          sideboard: deetz.sideboard,
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
      this.queueSaveDeckChange();
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
      this.queueSaveDeckChange();
      this.updateSideboardTitle();
    } else if (action === "similar") {
      this.onSearchAction(action, cardId);
    } else if (action === "tomainboard") {
      this.onSideboardAction("remove", cardId);
      this.onSearchAction("add", cardId);
      this.queueSaveDeckChange();
      this.updateSideboardTitle();
    }
    this.updateTitle();
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

  private getCardsByName(
    bulkName: string
  ): { ids: string[]; errors: string[] } {
    const parseRegex = /([0-9]+)?x?\s*([a-zA-Z, '`-]+)/;
    const result: { ids: string[]; errors: string[] } = { ids: [], errors: [] };
    const rawLines = (bulkName + "").split("\n");
    const cleanNameMap: { [name: string]: string } = {};

    const cleanName = (name?: string) => {
      return (name + "")
        .toLowerCase()
        .split("/")[0]
        .replace(/[^a-zA-Z]/g, "");
    };

    const nameToID = this.dl.getMapData("NameToID");
    if (!nameToID) {
      return result;
    }

    for (const name in nameToID) {
      const id = nameToID[name][0];
      const cname = cleanName(name);
      cleanNameMap[cname] = id;
    }

    for (const rawLine of rawLines) {
      console.log("Checking " + rawLine);
      const res = parseRegex.exec(rawLine);
      console.log(res);
      if (res) {
        const count = res[1] || 1;
        const name = cleanName(res[2]);
        const cardId = cleanNameMap[name];
        if (!cardId) {
          result.errors.push(res[2]);
        } else {
          for (let i = 0; i < count; i++) {
            result.ids.push(cardId);
          }
        }
      }
    }
    return result;
  }

  private async updateTTSLink(): Promise<void> {
    const ttsLink = this.getIncludedData().deckDetails.ttsLink;
    const btnExportTTS = document.querySelector("#actionExportTTS");
    if (!btnExportTTS) {
      return;
    }

    if (ttsLink && btnExportTTS.getAttribute("href") === "#") {
      console.log("Requesting " + ttsLink);
      const data = await get(ttsLink);
      btnExportTTS.innerHTML = "Download Tabletop Simulator Deck";
      btnExportTTS.setAttribute(
        "href",
        "data:text/json," + encodeURIComponent(JSON.stringify(data))
      );
      btnExportTTS.setAttribute(
        "download",
        this.getIncludedData().deckDetails.name + ".json"
      );
    } else {
      $("#actionExportTTS").text("Export to Tabletop Simulator");
      $("#actionExportTTS").attr("href", "#");
      $("#actionExportTTS").removeAttr("download");
    }
  }

  private showPopup(popup: HTMLElement | null): void {
    if (popup) {
      popup.classList.remove("nodisp");
      if (popup.parentElement) {
        const pWidth = popup.parentElement.clientWidth;
        const popupContentEle = popup.querySelector("> .popup") as HTMLElement;
        if (popupContentEle) {
          const width = popupContentEle.clientWidth;
          popupContentEle.style.marginLeft = pWidth / 2 - width / 2 + "px";
        }
      }
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new DeckViewerViewBehavior();
behavior;

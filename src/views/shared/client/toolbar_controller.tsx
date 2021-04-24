import * as ReactDom from "react-dom";
import * as React from "react";
import { post } from "./request";
import { DataDetailsResponse, ToolbarNewDeckResponse } from "../handler_types";
import { GetImageUrl } from "./utils";
import { DeckInfo } from "../../../server/handler_views";

declare let includedData: {
  decks: DeckInfo[];
};

export default class ToolbarController {
  public constructor() {}

  public documentReady(dataDetails: DataDetailsResponse): void {
    this.dataDetails = dataDetails;
    this.renderDeckList(dataDetails);
  }

  public async setDeckKeyCard(deckId: string, cardId: string): Promise<void> {
    for (let i = 0; i < includedData!.decks.length; ++i) {
      if (includedData!.decks[i].id === deckId) {
        includedData!.decks[i].keyCard = cardId;
        break;
      }
    }
    this.renderDeckList(this.dataDetails);
  }

  public async setDeckCardsAndColors(
    deckId: string,
    count: number,
    colors: string[]
  ): Promise<void> {
    for (let i = 0; i < includedData!.decks.length; ++i) {
      if (includedData!.decks[i].id === deckId) {
        includedData!.decks[i].cardCount = count;
        includedData!.decks[i].colors = colors;
        break;
      }
    }
    this.renderDeckList(this.dataDetails);
  }

  private renderDeck(
    key: number,
    deck: DeckInfo,
    className: string,
    dataDetails: DataDetailsResponse
  ): JSX.Element {
    return (
      <div
        className={
          "tbDeck " +
          className +
          " " +
          (deck.index >= 0 && deck.keyCard === "" ? "nostarDeck" : "")
        }
        key={"deck" + key}
        data-deckid={deck.id}
        /*draggable={!!deck.id}*/
      >
        <div
          className="cardBg full"
          style={
            deck.keyCard
              ? {
                  backgroundImage:
                    "url(" + GetImageUrl(deck.keyCard, dataDetails) + ")",
                }
              : {}
          }
        ></div>
        <div className="gradiant full"></div>
        <div className="metadata">
          <div className="highlight metarow"></div>
          <div className="colors metarow">
            {deck.colors.map((c, i) => {
              return (
                <div
                  key={"deck" + key + " color" + i}
                  className={"tbDeck-" + c}
                ></div>
              );
            })}
          </div>
          <div className="cardcount metarow">
            {deck.cardCount > 0
              ? deck.cardCount + " Card" + (deck.cardCount > 1 ? "s" : "")
              : ""}
          </div>
        </div>
        <div className="tbDeckName">{deck.name}</div>
      </div>
    );
  }

  private async reorderDecks(deckId: string, targetId: string): Promise<void> {
    const deckToIndex: Record<string, number> = {};
    const newDecks: DeckInfo[] = [];
    let deck: DeckInfo | null = null;
    let before = true;
    for (let i = 0; i < includedData!.decks.length; ++i) {
      if (includedData!.decks[i].id === deckId) {
        deck = includedData!.decks[i];
        break;
      }
    }

    if (!deck) {
      return;
    }

    let deckIndex = 0;
    for (let i = 0; i < includedData!.decks.length; ++i) {
      if (includedData!.decks[i].id === deckId) {
        before = false;
        continue;
      }
      if (includedData!.decks[i].id === targetId && before) {
        deck.index = deckIndex++;
        deckToIndex[deck.id] = deck.index;
        newDecks.push(deck);
      }
      includedData!.decks[i].index = deckIndex++;
      deckToIndex[includedData!.decks[i].id] = includedData!.decks[i].index;
      newDecks.push(includedData!.decks[i]);
      if (includedData!.decks[i].id === targetId && !before) {
        deck.index = deckIndex++;
        deckToIndex[deck.id] = deck.index;
        newDecks.push(deck);
      }
    }
    if (targetId === "") {
      deck.index = deckIndex++;
      deckToIndex[deck.id] = deck.index;
      newDecks.push(deck);
    }
    includedData.decks = newDecks;

    // TODO
    // UpdateMetadata(deckToIndex);
    this.renderDeckList(this.dataDetails);
  }

  private async renderDeckList(
    dataDetails: DataDetailsResponse
  ): Promise<void> {
    const dropdown = document.querySelector("#deckDropdown");
    const root = document.createElement("div");
    dropdown!.innerHTML = "";
    dropdown!.appendChild(root);
    const eles: JSX.Element[] = [];
    const decks = includedData?.decks || [];
    decks.sort((a, b) => {
      return a.index > b.index ? 1 : -1;
    });
    // eles.push(
    //   this.renderDeck(
    //     decks.length,
    //     {
    //       cardCount: -1,
    //       colors: [],
    //       id: "",
    //       keyCard: "",
    //       name: "Folder Name",
    //       index: 0,
    //     },
    //     "tbDeckFolder",
    //     dataDetails
    //   )
    // );
    for (let deckI = 0; deckI < decks.length; deckI++) {
      eles.push(this.renderDeck(deckI, decks[deckI], "", dataDetails));
    }
    eles.push(
      this.renderDeck(
        decks.length,
        {
          cardCount: -1,
          colors: ["white", "blue", "black", "red", "green"],
          id: "",
          keyCard: "",
          name: "New Deck",
          index: -1,
        },
        "",
        dataDetails
      )
    );
    ReactDom.render(eles, root);

    let draggedDiv: HTMLDivElement | null = null;
    let hoveredDiv: HTMLDivElement | null = null;
    let lastHoverEnd = 0;

    document.querySelectorAll(".tbDeck").forEach((deckDiv) => {
      const deckId = deckDiv.getAttribute("data-deckid");
      let is_dragged = false;
      deckDiv.addEventListener("click", async () => {
        if (deckId === "") {
          const deckData = await post<void, ToolbarNewDeckResponse>(
            "/toolbar/newdeck",
            undefined
          );
          window.location.replace(
            "/deckViewer/" + deckData?.deckId + "/edit.html"
          );
        } else {
          window.location.replace("/deckViewer/" + deckId + "/edit.html");
        }
      });

      if (deckId !== "") {
        deckDiv.addEventListener(
          "dragstart",
          () => {
            draggedDiv = deckDiv as HTMLDivElement;
            draggedDiv.style.opacity = "0.75";
            is_dragged = true;
          },
          false
        );

        deckDiv.addEventListener(
          "dragend",
          () => {
            if (hoveredDiv && new Date().getTime() - lastHoverEnd < 50) {
              this.reorderDecks(
                deckId!,
                hoveredDiv.getAttribute("data-deckid") || ""
              );
            } else {
              draggedDiv!.style.opacity = "1.0";
              draggedDiv = null;
              is_dragged = false;
            }
          },
          false
        );
      }

      deckDiv.addEventListener(
        "dragenter",
        () => {
          // highlight potential drop target when the draggable element enters it
          if (!is_dragged) {
            (deckDiv as HTMLDivElement).style.opacity = "0.5";
            hoveredDiv = deckDiv as HTMLDivElement;
          }
        },
        false
      );

      deckDiv.addEventListener(
        "dragleave",
        () => {
          // reset background of potential drop target when the draggable element leaves it
          if (!is_dragged) {
            (deckDiv as HTMLDivElement).style.opacity = "1.0";
            lastHoverEnd = new Date().getTime();
          }
        },
        false
      );
    });
  }

  private dataDetails!: DataDetailsResponse;
}

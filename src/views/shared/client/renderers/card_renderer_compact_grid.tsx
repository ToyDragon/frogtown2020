import * as ReactDom from "react-dom";
import * as React from "react";

import { CardRendererGrid } from "./card_renderer_grid";
import { DataLoader } from "../data_loader";
import { Group, ActionHandler, ActionList } from "./base_card_renderer";

export class CardRendererCompactGrid extends CardRendererGrid {
  private hoveredCard: HTMLElement | null = null;

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

  public RenderOneGroup(
    group: Group,
    showDuplicates: boolean,
    _stackDuplciates: boolean,
    actions: ActionList
  ): void {
    let currentStack: JQuery | null = null;
    const usedNames: { [name: string]: boolean } = {};
    let count = 0;
    group.cardDivs = [];
    let firstGroup = true;
    if (!group.cardIds) {
      return;
    }

    const idToName = this.dl.getMapData("IDToName");
    if (!idToName) {
      return;
    }

    for (const cardId of group.cardIds) {
      const name = idToName[cardId] || cardId;
      if (!showDuplicates) {
        if (usedNames[name]) {
          continue;
        }
        usedNames[name] = true;
      }
      if (currentStack) {
        const cardDiv = this.RenderCard(cardId, actions);
        group.cardDivs.push(cardDiv);
        currentStack.append(cardDiv);
        if (currentStack.children().length === 8) {
          currentStack = null;
        }
        continue;
      }
      count++;
      if (count > 1000) {
        break;
      }

      const groupDiv = document.createElement("div");
      groupDiv.classList.add("group");

      let groupText = "";
      if (firstGroup) {
        firstGroup = false;
        groupText = group.title;
      }

      const containerRef = React.createRef<HTMLDivElement>();
      ReactDom.render(
        <React.Fragment>
          {group.title ? (
            <div className="groupSeperator">{groupText}</div>
          ) : null}
          <div className="cardContainer" ref={containerRef}></div>
        </React.Fragment>,
        groupDiv
      );

      const cardDiv = this.RenderCard(cardId, actions);
      group.cardDivs.push(cardDiv);
      currentStack = $(containerRef.current!);
      currentStack.append(cardDiv);

      this.cardArea.append(groupDiv);
    }
  }

  private RenderCard(cardId: string, actions: ActionList): HTMLDivElement {
    const actionDetails = this.GetActionDetails(actions);
    const card = document.createElement("div");
    card.classList.add("card");
    ReactDom.render(
      actionDetails.map((deet) => deet.element),
      card
    );
    card.setAttribute("data-id", cardId);
    this.SetupActions(actionDetails, cardId);

    //TODO add mousemove?
    card.addEventListener("mouseenter", (e) => {
      if (e.offsetY <= 40) {
        this.UpdateHoveredCard(card);
      } else {
        this.UpdateHoveredCard(null);
      }
    });

    card.addEventListener("mouseleave", () => {
      this.UpdateHoveredCard(null);
    });

    return card;
  }

  private UpdateHoveredCard(cardRef: HTMLElement | null): void {
    if (this.hoveredCard === cardRef) {
      return;
    }
    if (this.hoveredCard) {
      this.hoveredCard.classList.remove("hover");
    }
    this.hoveredCard = cardRef;
    if (this.hoveredCard) {
      this.hoveredCard.classList.add("hover");
    }
  }
}

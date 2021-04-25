import * as ReactDom from "react-dom";
import * as React from "react";

import { MiscOptions } from "../cardfilters/filter_misc_options";
import {
  BaseCardRenderer,
  Group,
  ActionList,
  CardRendererOptions,
} from "./base_card_renderer";
import { LoadCardImageIntoElement } from "../utils";
import { MapData } from "../data_loader";

export class CardRendererGrid extends BaseCardRenderer {
  public groups: Group[];

  public constructor(options: CardRendererOptions) {
    super(options);
    this.groups = [];
  }

  public GetDisplayName(): string {
    return "Grid";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return ["IDToName"];
  }

  public Initialize(): void {
    this.cardArea.classList.add("grid");
  }

  public Cleanup(): void {
    this.cardArea.style.paddingLeft = "0";
    this.cardArea.classList.remove("grid");
    this.cardArea.innerHTML = "";
  }

  public ChangeCardSet(cardIds: string[], miscOptions: MiscOptions): void {
    this.cardArea.innerHTML = "";
    this.groups = this.ParseGroups(cardIds, miscOptions);
    const showDuplicates = !!miscOptions["Show Duplicates"];
    const stackDuplicates = !!miscOptions["Stack Duplicates"];
    const actions: ActionList = this.ParseActions(miscOptions);
    for (const group of this.groups) {
      this.RenderOneGroup(group, showDuplicates, stackDuplicates, actions);
    }
  }

  public RenderOneGroup(
    group: Group,
    showDuplicates: boolean,
    stackDuplicates: boolean,
    actions: ActionList
  ): void {
    const nameToTitleDivAndCount: {
      [name: string]: { div: JQuery; child_count: number };
    } = {};
    const usedNames: { [name: string]: boolean } = {};
    let count = 0;
    group.cardDivs = [];
    let firstGroup = true;
    const idToName = this.dl.getMapData("IDToName");
    if (!group.cardIds || !idToName) {
      return;
    }
    for (const cardId of group.cardIds) {
      const name = idToName[cardId] || cardId;
      if (!showDuplicates) {
        if (usedNames[name]) {
          continue;
        }
        usedNames[name] = true;
      } else {
        if (stackDuplicates && nameToTitleDivAndCount[name]) {
          // eslint-disable-next-line prettier/prettier
          const cardDiv = document.createElement("div");
          cardDiv.classList.add("card");
          cardDiv.setAttribute("data-id", cardId);
          nameToTitleDivAndCount[name].div.prepend(cardDiv);
          nameToTitleDivAndCount[name].child_count++;
          group.cardDivs.push(cardDiv);
          if (nameToTitleDivAndCount[name].child_count === 4) {
            delete nameToTitleDivAndCount[name];
          }
          continue;
        }
      }
      count++;
      if (count > 1000) {
        break;
      }

      // eslint-disable-next-line prettier/prettier
      const groupDiv = document.createElement("div");
      groupDiv.classList.add("group");

      let groupText = "";
      if (firstGroup) {
        firstGroup = false;
        groupText = group.title;
      }

      const actionDetails = this.GetActionDetails(actions);

      const cardRef = React.createRef<HTMLDivElement>();
      const containerRef = React.createRef<HTMLDivElement>();
      ReactDom.render(
        <React.Fragment>
          {group.title ? (
            <div className="groupSeperator" key="groupSeperator">
              {groupText}
            </div>
          ) : null}
          <div className="cardContainer" ref={containerRef}>
            <div className="card" data-id={cardId} ref={cardRef}></div>
            {actionDetails.map((deet) => deet.element)}
          </div>
        </React.Fragment>,
        groupDiv
      );

      if (!cardRef.current || !containerRef.current) {
        return;
      }

      group.cardDivs.push(cardRef.current);
      if (stackDuplicates) {
        nameToTitleDivAndCount[name] = {
          div: $(containerRef.current),
          child_count: 1,
        };
      }
      this.SetupActions(actionDetails, cardId);

      this.cardArea.append(groupDiv);
    }
  }

  public UpdateDisplayedCards(): void {
    if (this.groups.length === 0 || this.groups[0].cardDivs.length === 0) {
      return;
    }
    const margin = 32;
    const cardWidth = 223 + margin;
    const width = this.cardArea.clientWidth || 0;
    const stacksInRow = Math.floor(width / cardWidth);
    const wastedSpace = width - stacksInRow * cardWidth;
    const leftMargin = Math.floor(wastedSpace / 2);
    this.cardArea.style.paddingLeft = leftMargin + "px";
    const scrollOffset = this.cardArea.parentElement?.scrollTop || 0;

    const parentHeight = this.scrollingParent.clientHeight || 0;
    const cardHeight = this.groups[0].cardDivs[0].clientHeight || 0;
    const scrollBuffer = 300; //distance off the bottom and top that cards should start loading

    let failedCards = 0;
    groupLoop: for (const group of this.groups) {
      for (const cardDiv of group.cardDivs) {
        let y = -scrollOffset;
        let ele: HTMLElement | null = cardDiv;
        while (ele && !ele.classList.contains("cardDisplay")) {
          y += ele.offsetTop;
          ele = ele.parentElement;
        }
        if (y < -cardHeight) {
          continue;
        }
        if (y > parentHeight + cardHeight + scrollBuffer) {
          failedCards++;
          if (failedCards === stacksInRow * 8) {
            // assume max of 8 for compact grid
            break groupLoop;
          } else {
            continue;
          }
        }
        failedCards = 0;
        LoadCardImageIntoElement(
          cardDiv.getAttribute("data-id") || "",
          this.dl.dataDetails!,
          cardDiv
        );
      }
    }
  }
}

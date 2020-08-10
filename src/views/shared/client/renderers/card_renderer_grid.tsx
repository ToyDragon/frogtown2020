import * as ReactDom from "react-dom";
import * as React from "react";

import { MiscOptions } from "../cardfilters/filter_misc_options";
import {
  BaseCardRenderer,
  Group,
  ActionHandler,
  ActionList,
} from "./base_card_renderer";
import { LoadCardImageIntoElement } from "../utils";
import { DataLoader, MapData } from "../data_loader";

export class CardRendererGrid extends BaseCardRenderer {
  public groups: Group[];

  public constructor(
    dataLoader: DataLoader,
    cardArea: JQuery,
    scrollingParent: JQuery,
    allowEdit: boolean,
    actionHandler: ActionHandler
  ) {
    super(dataLoader, cardArea, scrollingParent, allowEdit, actionHandler);
    this.groups = [];
  }

  public GetDisplayName(): string {
    return "Grid";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return [];
  }

  public Initialize(): void {
    this.cardArea.addClass("grid");
  }

  public Cleanup(): void {
    this.cardArea.css("padding-left", "0");
    this.cardArea.removeClass("grid");
    this.cardArea.empty();
  }

  public ChangeCardSet(cardIds: string[], miscOptions: MiscOptions): void {
    this.cardArea.empty();
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
    const nameToTitleDiv: { [name: string]: JQuery } = {};
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
        if (stackDuplicates && nameToTitleDiv[name]) {
          // eslint-disable-next-line prettier/prettier
          const cardDiv = $("<div class=\"card\"></div>");
          cardDiv.attr("data-id", cardId);
          nameToTitleDiv[name].prepend(cardDiv);
          group.cardDivs.push(cardDiv);
          if (nameToTitleDiv[name].children().length === 8) {
            delete nameToTitleDiv[name];
          }
          continue;
        }
      }
      count++;
      if (count > 1000) {
        break;
      }

      // eslint-disable-next-line prettier/prettier
      const groupDiv = $("<div class=\"group\"></div>");

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
        groupDiv[0]
      );

      if (!cardRef.current || !containerRef.current) {
        return;
      }

      group.cardDivs.push($(cardRef.current));
      if (stackDuplicates) {
        nameToTitleDiv[name] = $(containerRef.current);
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
    const width = this.cardArea.innerWidth() || 0;
    const stacksInRow = Math.floor(width / cardWidth);
    const wastedSpace = width - stacksInRow * cardWidth;
    const leftMargin = Math.floor(wastedSpace / 2);
    this.cardArea.css("padding-left", leftMargin + "px");

    const parentHeight = this.scrollingParent.innerHeight() || 0;
    const cardHeight = this.groups[0].cardDivs[0].outerHeight() || 0;
    const scrollBuffer = 300; //distance off the bottom and top that cards should start loading

    let failedCards = 0;
    groupLoop: for (const group of this.groups) {
      for (const cardDiv of group.cardDivs) {
        let y = 0;
        let ele = cardDiv;
        while (ele && !ele.hasClass("cardDisplay")) {
          y += ele.position().top;
          ele = ele.parent();
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
          cardDiv.attr("data-id") || "",
          this.dl.dataDetails!,
          cardDiv[0]
        );
      }
    }
  }
}
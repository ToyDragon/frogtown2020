import * as ReactDom from "react-dom";
import * as React from "react";

import { MiscOptions } from "../cardfilters/filter_misc_options";
import {
  BaseCardRenderer,
  Group,
  ActionList,
  ActionHandler,
} from "./base_card_renderer";
import * as Utils from "../utils";
import { DataLoader, MapData } from "../data_loader";

export class CardRendererDetails extends BaseCardRenderer {
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
    return "Details";
  }

  public GetRequiredMaps(): (keyof MapData)[] {
    return [
      "IDToPower",
      "IDToToughness",
      "IDToName",
      "IDToCost",
      "IDToType",
      "IDToSupertype",
      "IDToSubtype",
      "IDToText",
      "IDToRarity",
      "IDToSetCode",
    ];
  }

  public Initialize(): void {
    this.cardArea.addClass("details");
  }

  public Cleanup(): void {
    this.cardArea.removeClass("details");
    this.cardArea.empty();
  }

  public ChangeCardSet(cardIds: string[], miscOptions: MiscOptions): void {
    this.cardArea.empty();
    this.groups = this.ParseGroups(cardIds, miscOptions);
    const showDuplicates = !!miscOptions["Show Duplicates"];
    const stackDuplicates = !!miscOptions["Stack Duplicates"];
    const actions = this.ParseActions(miscOptions);
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
    const nameToTitleDiv: { [name: string]: JQuery<HTMLElement> } = {};
    // eslint-disable-next-line prettier/prettier
    const groupDiv = $("<div class=\"group\"></div>");
    if (group.title) {
      // eslint-disable-next-line prettier/prettier
      const groupSeperator = $("<div class=\"groupSeperator\"></div>");
      groupSeperator.text(group.title);
      groupDiv.append(groupSeperator);
    }
    group.cardDivs = [];
    const usedNames: { [name: string]: boolean } = {};
    let count = 0;
    // eslint-disable-next-line prettier/prettier
    const cardList = $("<div class=\"cardList\"></div>");
    groupDiv.append(cardList);
    const idToName = this.dl.getMapData("IDToName");
    if (!group.cardIds || !idToName) {
      return;
    }
    for (const cardId of group.cardIds) {
      const name = idToName[cardId];
      if (!showDuplicates) {
        if (usedNames[name]) {
          continue;
        }
        usedNames[name] = true;
      } else if (stackDuplicates) {
        if (nameToTitleDiv[name]) {
          let num = Number(nameToTitleDiv[name].text());
          num++;
          nameToTitleDiv[name].text(num);
          continue;
        }
      }
      count++;
      if (count > 200) {
        break;
      }
      // eslint-disable-next-line prettier/prettier
      const cardDiv = $("<div class=\"card\"></div>");
      // eslint-disable-next-line prettier/prettier
      const previewDiv = $("<div class=\"preview\"></div>");
      previewDiv.attr("data-id", cardId);
      cardDiv.append(previewDiv);
      group.cardDivs.push(previewDiv);
      // eslint-disable-next-line prettier/prettier
      const detailsDiv = $("<div class=\"details\"></div>");

      const idToSetCode = this.dl.getMapData("IDToSetCode");
      const idToRarity = this.dl.getMapData("IDToRarity");
      const idToText = this.dl.getMapData("IDToText");
      const idToPower = this.dl.getMapData("IDToPower");
      const idToToughness = this.dl.getMapData("IDToToughness");
      const idToCost = this.dl.getMapData("IDToCost");
      const idToSupertype = this.dl.getMapData("IDToSupertype");
      const idToType = this.dl.getMapData("IDToType");
      const idToSubtype = this.dl.getMapData("IDToSubtype");

      if (
        !idToSetCode ||
        !idToRarity ||
        !idToText ||
        !idToPower ||
        !idToToughness ||
        !idToCost ||
        !idToSupertype ||
        !idToType ||
        !idToSubtype
      ) {
        return;
      }

      const setCode = idToSetCode[cardId];
      const rarity = idToRarity[cardId];
      let setClass = "set";
      if (rarity) {
        setClass += " " + rarity;
      }

      let cardText = idToText[cardId] || "";
      cardText = Utils.ReplaceSymbols(cardText);
      cardText = Utils.ReplaceNewlines(cardText);

      const power = idToPower[cardId];
      const toughness = idToToughness[cardId];
      let srText = "";
      if (power || toughness) {
        srText = power + "/" + toughness;
      }

      let costText = idToCost[cardId] || "";
      costText = Utils.ReplaceSymbols(costText);

      let typeString = "";
      const superTypes = idToSupertype[cardId];
      if (superTypes) {
        typeString += superTypes.join(" ") + " ";
      }
      const types = idToType[cardId];
      if (types) {
        typeString += types.join(" ");
      }
      const subTypes = idToSubtype[cardId];
      if (subTypes) {
        typeString += " - " + subTypes.join(" ");
      }

      if (Utils.IsDebug()) {
        typeString = cardId + " . " + typeString;
      }

      const actionDetails = this.GetActionDetails(actions);

      const setReference = React.createRef<SVGSVGElement>();
      const titleCountPrefix = stackDuplicates ? "x " : "";
      const titleCountReference = React.createRef<HTMLDivElement>();
      ReactDom.render(
        <React.Fragment>
          <div className="titleLine">
            <svg
              className={setClass}
              ref={setReference}
              data-setcode={setCode}
            ></svg>
            <div className="title">
              <span ref={titleCountReference}></span>
              {titleCountPrefix + name}
            </div>
            <div
              className="cost"
              dangerouslySetInnerHTML={{ __html: costText }}
            ></div>
          </div>
          <div className="typeAndStats">
            <div className="powerToughness">{srText}</div>
            <div
              className="type"
              dangerouslySetInnerHTML={{ __html: typeString }}
            ></div>
          </div>
          <div
            className="text"
            dangerouslySetInnerHTML={{ __html: cardText }}
          ></div>
          {actionDetails.map((deet) => deet.element)}
        </React.Fragment>,
        detailsDiv[0]
      );
      cardDiv.append(detailsDiv);

      if (stackDuplicates && titleCountReference.current) {
        nameToTitleDiv[name] = $(titleCountReference.current);
        nameToTitleDiv[name].text(1);
      }
      this.SetupActions(actionDetails, cardId);

      if (setCode && setReference.current) {
        this.putSetSVG($(setReference.current), setCode);
      }

      cardDiv.addClass(count % 2 === 0 ? "even" : "odd");
      cardList.append(cardDiv);
    }
    this.cardArea.append(groupDiv);
  }

  public UpdateDisplayedCards(): void {
    if (this.groups.length === 0 || this.groups[0].cardDivs.length === 0) {
      return;
    }
    const parentHeight = this.scrollingParent.innerHeight() || 0;
    const cardHeight = this.groups[0].cardDivs[0].outerHeight() || 0;

    groupLoop: for (const group of this.groups) {
      for (const cardDiv of group.cardDivs) {
        const y = cardDiv.position().top;
        if (y < -cardHeight) {
          continue;
        }
        if (y > parentHeight + cardHeight) {
          break groupLoop;
        }
        Utils.LoadCardImageIntoElement(
          cardDiv.attr("data-id") || "",
          this.dl.dataDetails!,
          cardDiv[0]
        );
      }
    }
  }
}

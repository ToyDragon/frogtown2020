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
    cardArea: HTMLElement,
    scrollingParent: HTMLElement,
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
    this.cardArea.classList.add("details");
  }

  public Cleanup(): void {
    this.cardArea.classList.remove("details");
    this.cardArea.innerHTML = "";
  }

  public ChangeCardSet(cardIds: string[], miscOptions: MiscOptions): void {
    this.cardArea.innerHTML = "";
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
    const groupDiv = document.createElement("div");
    groupDiv.classList.add("group");
    if (group.title) {
      const groupSeperator = document.createElement("div");
      groupSeperator.classList.add("groupSeperator");
      groupSeperator.innerHTML = group.title;
      groupDiv.append(groupSeperator);
    }
    group.cardDivs = [];
    const usedNames: { [name: string]: boolean } = {};
    let count = 0;
    const cardList = document.createElement("div");
    cardList.classList.add("cardList");
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
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");
      const previewDiv = document.createElement("div");
      previewDiv.classList.add("preview");
      previewDiv.setAttribute("data-id", cardId);
      cardDiv.append(previewDiv);
      group.cardDivs.push(previewDiv);
      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("details");

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
        detailsDiv
      );
      cardDiv.append(detailsDiv);

      if (stackDuplicates && titleCountReference.current) {
        nameToTitleDiv[name] = $(titleCountReference.current);
        nameToTitleDiv[name].text(1);
      }
      this.SetupActions(actionDetails, cardId);

      if (setCode && setReference.current) {
        this.putSetSVG(setReference.current, setCode);
      }

      cardDiv.classList.add(count % 2 === 0 ? "even" : "odd");
      cardList.append(cardDiv);
    }
    this.cardArea.append(groupDiv);
  }

  public UpdateDisplayedCards(): void {
    if (this.groups.length === 0 || this.groups[0].cardDivs.length === 0) {
      return;
    }
    const parentHeight = this.scrollingParent.clientHeight || 0;
    const cardHeight = this.groups[0].cardDivs[0].clientHeight || 0;

    groupLoop: for (const group of this.groups) {
      for (const cardDiv of group.cardDivs) {
        const y = cardDiv.offsetTop;
        if (y < -cardHeight) {
          continue;
        }
        if (y > parentHeight + cardHeight) {
          break groupLoop;
        }
        Utils.LoadCardImageIntoElement(
          cardDiv.getAttribute("data-id") || "",
          this.dl.dataDetails!,
          cardDiv
        );
      }
    }
  }
}

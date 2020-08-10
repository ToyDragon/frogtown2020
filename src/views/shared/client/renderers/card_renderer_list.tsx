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

export class CardRendererList extends BaseCardRenderer {
  public hoverCard!: JQuery;
  public groups: Group[];

  private static RARITY_TO_SYMBOL: Record<string, string | undefined> = {
    "Basic Land": "C",
    "basic land": "C",
    Common: "C",
    common: "C",
    Uncommon: "U",
    uncommon: "U",
    Rare: "R",
    rare: "R",
    "Mythic Rare": "M",
    "mythic rare": "M",
    Special: "S",
    special: "S",
  };

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
    return "List";
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
      "IDToRarity",
      "IDToSetCode",
    ];
  }

  public Initialize(): void {
    this.cardArea.addClass("list");
    // eslint-disable-next-line prettier/prettier
    this.hoverCard = $("<img class=\"hoverCard nodisp\" />");
    this.cardArea.append(this.hoverCard);
    this.hoverCard.on("error", () => {
      this.hoverCard.attr("src", "/CardBack.jpg");
    });
  }

  private CreateCardList(): JQuery {
    // eslint-disable-next-line prettier/prettier
    const cardList = $("<div class=\"cardList\"></div>");
    cardList.on("mouseout", () => {
      this.hoverCard.addClass("nodisp");
    });

    return cardList;
  }

  public Cleanup(): void {
    this.cardArea.removeClass("list");
    this.cardArea.empty();
  }

  public ChangeCardSet(cardIds: string[], miscOptions: MiscOptions): void {
    this.hoverCard.addClass("nodisp");
    this.cardArea.find(".group").remove();
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
    // eslint-disable-next-line prettier/prettier
    const groupDiv = $("<div class=\"group\"></div>");
    if (group.title) {
      // eslint-disable-next-line prettier/prettier
      const groupSeperator = $("<div class=\"groupSeperator\"></div>");
      groupSeperator.text(group.title);
      groupDiv.append(groupSeperator);
    }
    const cardList = this.CreateCardList();
    groupDiv.append(cardList);
    if (!group.cardIds) {
      return;
    }

    const idToName = this.dl.getMapData("IDToName");
    const idToSupertype = this.dl.getMapData("IDToSupertype");
    const idToType = this.dl.getMapData("IDToType");
    const idToSubtype = this.dl.getMapData("IDToSubtype");
    const idToSetCode = this.dl.getMapData("IDToSetCode");
    const idToRarity = this.dl.getMapData("IDToRarity");
    const idToPower = this.dl.getMapData("IDToPower");
    const idToToughness = this.dl.getMapData("IDToToughness");
    const idToCost = this.dl.getMapData("IDToCost");
    if (
      !idToName ||
      !idToSupertype ||
      !idToType ||
      !idToSubtype ||
      !idToSetCode ||
      !idToRarity ||
      !idToPower ||
      !idToToughness ||
      !idToCost
    ) {
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
      cardDiv.addClass(count % 2 === 0 ? "even" : "odd");
      cardDiv.attr("data-id", cardId);

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

      const setStyle = { backgroundImage: "" };
      const setCode = idToSetCode[cardId];
      const rarity = idToRarity[cardId];
      let setClass = "set";
      if (rarity) {
        setClass += " " + rarity;
      }
      if (setCode && rarity && CardRendererList.RARITY_TO_SYMBOL[rarity]) {
        setStyle.backgroundImage =
          "url(/Icons/Sets/" +
          setCode +
          "_" +
          CardRendererList.RARITY_TO_SYMBOL[rarity] +
          ".jpg)";
      }

      const power = idToPower[cardId];
      const toughness = idToToughness[cardId];
      let strengthToughnessText = "";
      if (power || toughness) {
        strengthToughnessText = power + "/" + toughness;
      }

      let costText = idToCost[cardId] || "";
      costText = Utils.ReplaceSymbols(costText);

      const actionDetails = this.GetActionDetails(actions);

      const titleCountPrefix = stackDuplicates ? "x " : "";
      const titleCountReference = React.createRef<HTMLDivElement>();
      const setReference = React.createRef<SVGSVGElement>();
      ReactDom.render(
        <React.Fragment>
          <svg
            className={setClass}
            key="set"
            ref={setReference}
            data-setcode={setCode}
          ></svg>
          <div className="strengthToughness" key="strengthToughness">
            {strengthToughnessText}
          </div>
          <div className="title" key="title">
            <span ref={titleCountReference}></span>
            {titleCountPrefix + name}
          </div>
          <div
            className="cost"
            key="cost"
            dangerouslySetInnerHTML={{ __html: costText }}
          ></div>
          <div className="type" key="type">
            {typeString}
          </div>
          {actionDetails.map((deet) => deet.element)}
        </React.Fragment>,
        cardDiv[0]
      );
      cardList.append(cardDiv);

      if (stackDuplicates && titleCountReference.current) {
        nameToTitleDiv[name] = $(titleCountReference.current);
        nameToTitleDiv[name].text(1);
      }
      this.SetupActions(actionDetails, cardId);

      if (setCode && setReference.current) {
        this.putSetSVG($(setReference.current), setCode);
      }

      cardDiv.on("mouseover", (event) => {
        this.hoverCard.attr("data-id", cardId);
        this.hoverCard.attr("data-lastFailedId", "");
        this.hoverCard.attr(
          "src",
          Utils.GetImageUrl(cardId, this.dl.dataDetails!)
        );
        this.hoverCard.removeClass("nodisp");
        this.UpdateHoverPosition(event.pageX, event.pageY);
      });

      cardDiv.on("mousemove", (event) => {
        this.UpdateHoverPosition(event.pageX, event.pageY);
      });
    }
    this.cardArea.append(groupDiv);
  }

  public UpdateHoverPosition(posX: number, posY: number): void {
    const cardHeight = this.hoverCard.outerHeight() || 0;
    const bodyHeight = $("body").outerHeight() || 0;
    if (posY > bodyHeight - cardHeight) {
      posY -= cardHeight;
    }
    this.hoverCard.css("left", posX + "px");
    this.hoverCard.css("top", posY + "px");
  }

  public UpdateDisplayedCards(): void {}
}

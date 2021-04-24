import { DataLoader, CardIDMap, MapData } from "../data_loader";
import { MiscOptions } from "../cardfilters/filter_misc_options";
import * as React from "react";
import { requestRaw } from "../request";

export class Group {
  public title = "";
  public cardIds: string[] = [];
  public cardDivs: HTMLElement[] = [];
  public groupDiv: HTMLElement = document.createElement("div");

  private GetSortableData(
    dl: DataLoader
  ): { name: string; id: string; release: string }[] {
    let cardsWithData: { name: string; id: string; release: string }[] = [];
    const idToSetCode = dl.getMapData("IDToSetCode");
    const idToName = dl.getMapData("IDToName");
    const setCodeToRelease = dl.getMapData("SetCodeToRelease");

    cardsWithData = this.cardIds.map((x) => {
      const data = {
        id: x,
        name: x,
        release: "",
      };
      if (idToSetCode && setCodeToRelease) {
        const setCode = idToSetCode[x] || "";
        data.release = setCodeToRelease[setCode] || "dummy";
      }
      if (idToName) {
        data.name = idToName[x];
      }
      return data;
    });
    return cardsWithData;
  }

  public TrySortByRelease(dl: DataLoader): void {
    const cardsWithNames = this.GetSortableData(dl);
    this.cardIds = cardsWithNames
      .sort((a, b) => {
        if (a.release === b.release) {
          return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
        }
        return a.release > b.release ? -1 : 1;
      })
      .map((a) => {
        return a.id;
      });
  }

  public TrySortByName(dl: DataLoader): void {
    const cardsWithNames = this.GetSortableData(dl);
    this.cardIds = cardsWithNames
      .sort((a, b) => {
        if (a.name === b.name) {
          return a.release === b.release ? 0 : a.release > b.release ? -1 : 1;
        }
        return a.name > b.name ? 1 : -1;
      })
      .map((a) => {
        return a.id;
      });
  }
}

export interface ActionList {
  add: boolean;
  remove: boolean;
  similar: boolean;
  tomainboard: boolean;
  tosideboard: boolean;
  star: boolean;
}

export type ActionHandler = (action: keyof ActionList, cardId: string) => void;

export interface ActionDetail {
  key: keyof ActionList;
  element: React.ReactElement<HTMLDivElement>;
  ref: React.RefObject<HTMLDivElement>;
}

export interface CardRendererOptions {
  dataLoader: DataLoader;
  cardArea: HTMLElement;
  scrollingParent: HTMLElement;
  allowEdit: boolean;
  actionHandler: ActionHandler;
}

export abstract class BaseCardRenderer {
  protected cardArea: HTMLElement;
  protected scrollingParent: HTMLElement;
  protected dl: DataLoader;
  protected actionHandler: ActionHandler;

  private pendingSetSVGs: {
    [setCode: string]: SVGSVGElement[];
  } = {};
  private svgBySet: { [setCode: string]: string } = {};
  private allowEdit: boolean;

  public constructor(options: CardRendererOptions) {
    this.dl = options.dataLoader;
    this.cardArea = options.cardArea;
    this.scrollingParent = options.scrollingParent;
    this.allowEdit = options.allowEdit;
    this.actionHandler = options.actionHandler;
  }

  public ChangeCardSet(_cardIds: string[], _miscOptions: MiscOptions): void {}
  public UpdateDisplayedCards(): void {}
  public Initialize(): void {}
  public Cleanup(): void {}
  public abstract GetDisplayName(): string;
  public abstract GetRequiredMaps(): (keyof MapData)[];

  public ParseActions(miscOptions: MiscOptions): ActionList {
    const actions: ActionList = {
      add: !!miscOptions["Action Add"] && this.allowEdit,
      remove: !!miscOptions["Action Remove"] && this.allowEdit,
      similar: !!miscOptions["Action Similar"],
      tomainboard: !!miscOptions["Action To Mainboard"] && this.allowEdit,
      tosideboard: !!miscOptions["Action To Sideboard"] && this.allowEdit,
      star: !!miscOptions["Action Star"] && this.allowEdit,
    };
    return actions;
  }

  public GetActionDetails(actions: ActionList): ActionDetail[] {
    const data: ActionDetail[] = [];
    if (actions.add) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "add",
        ref: ref,
        element: (
          <div
            className="action add"
            key="actionAdd"
            data-action="add"
            title="Add copy of card to deck"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }
    if (actions.remove) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "remove",
        ref: ref,
        element: (
          <div
            className="action remove"
            key="actionRemove"
            data-action="remove"
            title="Remove card from deck"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }
    if (actions.similar) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "similar",
        ref: ref,
        element: (
          <div
            className="action similar"
            key="actionSimilar"
            data-action="similar"
            title="Find other printings of this card"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }
    if (actions.tomainboard) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "tomainboard",
        ref: ref,
        element: (
          <div
            className="action mainboard"
            key="actionMainboard"
            data-action="tomainboard"
            title="Move card to mainboard"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }
    if (actions.tosideboard) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "tosideboard",
        ref: ref,
        element: (
          <div
            className="action sideboard"
            key="actionSideboard"
            data-action="tosideboard"
            title="Move card to sideboard"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }
    if (actions.star) {
      const ref = React.createRef<HTMLDivElement>();
      data.push({
        key: "star",
        ref: ref,
        element: (
          <div
            className="action star"
            key="actionStar"
            data-action="star"
            title="Mark as the key card to this deck"
            ref={ref}
          >
            <a href="#"></a>
          </div>
        ),
      });
    }

    return data;
  }

  public SetupActions(details: ActionDetail[], cardId: string): void {
    for (const detail of details) {
      if (detail.ref.current) {
        $(detail.ref.current).on("click", () => {
          this.actionHandler(detail.key, cardId);
        });
      }
    }
  }

  public ParseGroups(cardIds: string[], miscOptions: MiscOptions): Group[] {
    const groups: Group[] = [];
    if (miscOptions["Group Map"]) {
      const valueMap = this.dl.getAnyMapData(
        miscOptions["Group Map"]
      ) as CardIDMap<string | number | string[]>;
      const groupsByValue: { [value: string]: Group } = {};
      for (const cardId of cardIds) {
        let value = valueMap[cardId];
        if (Array.isArray(value)) {
          if (miscOptions["Group Map"] === "IDToColor") {
            value = value.map((shortColor: string) => {
              if (shortColor === "W") return "White";
              if (shortColor === "U") return "Blue";
              if (shortColor === "B") return "Black";
              if (shortColor === "R") return "Red";
              if (shortColor === "G") return "Green";
              return "Colorless";
            });
          }
          value = value
            .map((a) => {
              return a + "";
            })
            .join(" ");
        } else {
          if (miscOptions["Group Map"] === "IDToColor") {
            value = "Colorless";
          } else {
            value = value + "";
          }
        }
        let group = groupsByValue[value];
        if (!group) {
          group = new Group();
          group.title = value;
          group.cardIds = [];
          groups.push(group);
          groupsByValue[value] = group;
        }
        group.cardIds.push(cardId);
      }
      if (groups.length > 1) {
        groups.sort((a, b) => {
          const aTitle =
            Number(a.title).toString() === a.title ? Number(a.title) : a.title;
          const bTitle =
            Number(b.title).toString() === b.title ? Number(b.title) : b.title;
          return aTitle > bTitle ? 1 : -1;
        });
        for (const group of groups) {
          group.title += " (" + group.cardIds.length + ")";
        }
      }
    } else {
      const group = new Group();
      group.cardIds = cardIds;
      group.title = "";
      groups.push(group);
    }
    for (const group of groups) {
      if (miscOptions["Sort By Release"]) {
        group.TrySortByRelease(this.dl);
      } else {
        group.TrySortByName(this.dl);
      }
    }
    return groups;
  }

  public RequiredMiscOptions(): (keyof MiscOptions)[] {
    return [];
  }

  protected async putSetSVG(
    svg: SVGSVGElement,
    setCode: string
  ): Promise<void> {
    if (this.svgBySet[setCode]) {
      svg.innerHTML = this.svgBySet[setCode];
    } else {
      if (!this.dl.dataDetails) {
        console.log("Trying to show set svg before details loaded.");
        return;
      }
      const svgURL =
        this.dl.dataDetails.baseURL +
        "/" +
        this.dl.dataDetails.awsS3SetSVGBucket +
        "/" +
        setCode +
        ".svg";
      if (this.pendingSetSVGs[setCode]) {
        this.pendingSetSVGs[setCode].push(svg);
      } else {
        this.pendingSetSVGs[setCode] = [];
        this.pendingSetSVGs[setCode].push(svg);
        const svgString = (await requestRaw(svgURL, {}, "GET")).replace(
          / fill="[^"]+"/,
          ""
        );
        for (const ele of this.pendingSetSVGs[setCode]) {
          ele.innerHTML = svgString;
        }
        this.svgBySet[setCode] = svgString;
      }
    }
  }
}

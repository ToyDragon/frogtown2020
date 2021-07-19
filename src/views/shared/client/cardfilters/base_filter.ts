import { DataLoader } from "../data_loader";

export class BaseFilter {
  public container: HTMLElement;
  public valueDisplay: HTMLElement;
  public dataMapName: string;
  public idMapName: string;
  public dynamicOptions: boolean;
  public excludeoptions: { [option: string]: boolean };
  public filterclass: string;
  public updateHandler: () => void;
  public type: string;
  public active: boolean;
  public ready: boolean;
  public dl: DataLoader;

  public constructor(
    dataLoader: DataLoader,
    fitlertype: string,
    updateHandler: () => void
  ) {
    this.type = fitlertype;
    this.dl = dataLoader;
    this.container = document.querySelector(
      `div[data-filtertype=${fitlertype}]`
    ) as HTMLElement;
    this.dataMapName = this.container.getAttribute("data-datamapname") || "";
    this.idMapName = this.container.getAttribute("data-idmapname") || "";
    this.dynamicOptions =
      this.container.getAttribute("data-dynamicoptions") === "true";
    const allExcludedOptions = (
      this.container.getAttribute("data-excludeoptions") || ""
    ).split(",");
    this.excludeoptions = {};
    for (const option of allExcludedOptions) {
      if (option) {
        this.excludeoptions[option] = true;
      }
    }
    this.filterclass = this.container.getAttribute("data-filterclass") || "";
    this.valueDisplay = this.container.querySelector(
      ".dropdownValue"
    ) as HTMLElement;
    this.active = !this.container.classList.contains("nodisp");
    this.ready = false;
    this.updateHandler = updateHandler;
    this.setup();
  }

  public hide(): void {
    this.clear();
    this.container.classList.add("nodisp");
    this.active = false;
  }

  public show(): void {
    this.container.classList.remove("nodisp");
    this.active = true;
  }

  public getWeight(): number {
    if (!this.ready) {
      return -1;
    }
    const sourceMap = this.dl.getAnyMapData(this.dataMapName);
    if (!sourceMap || typeof sourceMap !== "object") {
      return -1;
    }
    return Object.keys(sourceMap).length;
  }

  protected setup(): void {}
  protected clear(): void {}

  protected requireAllValues(): boolean {
    return true;
  }

  protected noOtherValues(): boolean {
    return false;
  }

  public getValues(): string[] {
    return [];
  }

  protected applyPrimaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    const dataMap = this.dl.getAnyMapData(this.dataMapName) as Record<
      string,
      string[]
    >;
    const firstValue = requiredValues.splice(0, 1)[0];
    for (const id of dataMap[firstValue]) {
      cardIds.push(id);
    }
  }

  protected applyPrimaryFilterOr(
    cardIds: string[],
    requiredValueMap: Record<string, boolean>
  ): void {
    const dataMap = this.dl.getAnyMapData(this.dataMapName) as Record<
      string,
      string[]
    >;
    const foundIds: Record<string, boolean> = {};
    for (const value in requiredValueMap) {
      for (const id of dataMap[value]) {
        if (!foundIds[id]) {
          cardIds.push(id);
          foundIds[id] = true;
        }
      }
    }
  }

  protected applySecondaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    if (requiredValues.length > 0) {
      const idMap = this.dl.getAnyMapData(this.idMapName);
      if (!idMap) {
        return;
      }
      for (let cardIndex = cardIds.length - 1; cardIndex >= 0; cardIndex--) {
        const cardId = cardIds[cardIndex];
        let thisCardsValues = idMap[cardId];
        if (!Array.isArray(thisCardsValues)) {
          thisCardsValues = [thisCardsValues];
        }

        const thisCardsValueMap: Record<string, boolean> = {};
        for (const value of thisCardsValues as (number | string)[]) {
          thisCardsValueMap[value] = true;
        }

        for (const requiredValue of requiredValues) {
          if (!thisCardsValueMap[requiredValue]) {
            cardIds.splice(cardIndex, 1);
            break;
          }
        }
      }
    }
  }

  protected applySecondaryFilterOr(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    if (requiredValues.length > 0) {
      const idMap = this.dl.getAnyMapData(this.idMapName);
      if (!idMap) {
        return;
      }
      for (let cardIndex = cardIds.length - 1; cardIndex >= 0; cardIndex--) {
        const cardId = cardIds[cardIndex];
        let thisCardsValues = idMap[cardId];
        if (!Array.isArray(thisCardsValues)) {
          thisCardsValues = [thisCardsValues];
        }

        const thisCardsValueMap: Record<string, boolean> = {};
        for (const value of thisCardsValues as (number | string)[]) {
          thisCardsValueMap[value] = true;
        }

        let found = false;
        for (const requiredValue of requiredValues) {
          if (thisCardsValueMap[requiredValue]) {
            found = true;
          }
        }
        if (!found) {
          cardIds.splice(cardIndex, 1);
        }
      }
    }
  }

  protected applyNoOthersFilter(
    cardIds: string[],
    requiredValueMap: Record<string, boolean>
  ): void {
    const idMap = this.dl.getAnyMapData(this.idMapName);
    if (!idMap) {
      return;
    }
    for (let cardIndex = cardIds.length - 1; cardIndex >= 0; cardIndex--) {
      const cardId = cardIds[cardIndex];
      let thisCardsValues = idMap[cardId];
      if (!Array.isArray(thisCardsValues)) {
        thisCardsValues = [thisCardsValues];
      }

      for (const value of thisCardsValues as (number | string)[]) {
        if (!requiredValueMap[value]) {
          cardIds.splice(cardIndex, 1);
          break;
        }
      }
    }
  }

  public apply(cardIds: string[], firstFilter: boolean): void {
    if (!this.ready) {
      return;
    }

    const requiredValues = this.getValues().filter((value) => {
      return value.length > 0;
    });

    if (requiredValues.length === 0) {
      return;
    }

    const reqAll = this.requireAllValues();
    const requiredValueMap: Record<string, boolean> = {};
    for (const value of requiredValues) {
      requiredValueMap[value] = true;
    }

    if (firstFilter) {
      if (reqAll) {
        this.applyPrimaryFilterAnd(cardIds, requiredValues);
        this.applySecondaryFilterAnd(cardIds, requiredValues);
      } else {
        this.applyPrimaryFilterOr(cardIds, requiredValueMap);
      }
    } else {
      if (reqAll) {
        this.applySecondaryFilterAnd(cardIds, requiredValues);
      } else {
        this.applySecondaryFilterOr(cardIds, requiredValues);
      }
    }

    if (this.noOtherValues()) {
      this.applyNoOthersFilter(cardIds, requiredValueMap);
    }
  }

  protected valueChanged(): void {
    this.updateHandler();
  }

  public setValue(_value: unknown): void {}
}

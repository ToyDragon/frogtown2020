import { DataLoader } from "../data_loader";
import { MiscOptions } from "./filter_misc_options";

interface FilterDetails {
  dataMapName: string;
  idMapName: string;
  dynamicOptions: boolean;
  excludedOptions: Record<string, boolean>;
  filterClass: string;
}

export class BaseFilter {
  public container?: HTMLElement;
  public valueDisplay?: HTMLElement;
  public dataMapName!: string;
  public idMapName!: string;
  public dynamicOptions!: boolean;
  public excludeoptions!: { [option: string]: boolean };
  public filterclass!: string;
  public updateHandler: () => void;
  public type: string;
  public active!: boolean;
  public ready: boolean;
  public dl: DataLoader;
  public miscOptions: MiscOptions;

  public constructor(
    dataLoader: DataLoader,
    filtertype: string,
    updateHandler: () => void,
    filterDetails?: FilterDetails
  ) {
    this.dl = dataLoader;
    this.type = filtertype;
    this.miscOptions = {};
    if (filterDetails === undefined) {
      this.constructWithDomDetails();
    } else {
      if (this.requiresDom()) {
        throw new Error(
          "DOMless initialization not supported for this filter type."
        );
      }
      this.dataMapName = filterDetails.dataMapName;
      this.idMapName = filterDetails.idMapName;
      this.dynamicOptions = filterDetails.dynamicOptions;
      this.excludeoptions = filterDetails.excludedOptions;
      this.filterclass = filterDetails.filterClass;
      this.active = true;
    }
    this.ready = false;
    this.updateHandler = updateHandler;
    this.setup();
  }

  private constructWithDomDetails() {
    this.container = document.querySelector(
      `div[data-filtertype=${this.type}]`
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
  }

  public requiresDom(): boolean {
    //Some filters require elements from HTML
    //If you want to create a filter independent from the DOM, override this function manually.
    return true;
  }

  public hide(): void {
    this.clear();
    this.container!.classList.add("nodisp");
    this.active = false;
  }

  public show(): void {
    this.container!.classList.remove("nodisp");
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
    requiredValues: string[],
    _miscOptions: MiscOptions
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
    requiredValueMap: Record<string, boolean>,
    _miscOptions: MiscOptions
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
    requiredValues: string[],
    _miscOptions: MiscOptions
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
    requiredValues: string[],
    _miscOptions: MiscOptions
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
    requiredValueMap: Record<string, boolean>,
    _miscOptions: MiscOptions
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

  public apply(
    cardIds: string[],
    firstFilter: boolean,
    miscOptions: MiscOptions
  ): void {
    // TODO: Fix issues with altPane popup
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
        this.applyPrimaryFilterAnd(cardIds, requiredValues, miscOptions);
        this.applySecondaryFilterAnd(cardIds, requiredValues, miscOptions);
      } else {
        this.applyPrimaryFilterOr(cardIds, requiredValueMap, miscOptions);
      }
    } else {
      if (reqAll) {
        this.applySecondaryFilterAnd(cardIds, requiredValues, miscOptions);
      } else {
        this.applySecondaryFilterOr(cardIds, requiredValues, miscOptions);
      }
    }

    if (this.noOtherValues()) {
      this.applyNoOthersFilter(cardIds, requiredValueMap, miscOptions);
    }
  }

  protected valueChanged(): void {
    this.updateHandler();
  }

  public setValue(_value: unknown): void {}
}

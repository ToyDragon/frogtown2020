import { DataLoader } from "../client/data_loader";
import { BaseFilter } from "./cardfilters/base_filter";
import { FilterText } from "./cardfilters/filter_text";
import {
  FilterMiscOptions,
  MiscOptions,
} from "./cardfilters/filter_misc_options";
import { FilterDatalist } from "./cardfilters/filter_datalist";
import { FilterDropdown } from "./cardfilters/filter_dropdown";
import { FilterNumberRange } from "./cardfilters/filter_number_range";

export class CardSearchBehavior {
  public cardChangeCB: (cards: string[], options: MiscOptions) => void;
  public dl: DataLoader;
  private allFilters: BaseFilter[];
  public cardIds: string[] = [];
  private nameFilter: FilterText;
  private miscFilter: FilterMiscOptions;
  private bannedCards: { [cardId: string]: boolean } = {};

  public constructor(
    dl: DataLoader,
    cardChangeCB: (cards: string[], options: MiscOptions) => void
  ) {
    this.cardChangeCB = cardChangeCB;
    this.dl = dl;

    const applyFilterCallback = () => {
      this.ApplyFilter();
    };

    this.nameFilter = new FilterText(dl, "name", applyFilterCallback);
    const textFilter = new FilterText(dl, "text", applyFilterCallback);
    const rarityFilter = new FilterDropdown(dl, "rarity", applyFilterCallback);
    const setFilter = new FilterDatalist(dl, "set", applyFilterCallback);
    const colorFilter = new FilterDropdown(dl, "color", applyFilterCallback);
    const colorIdentityFilter = new FilterDropdown(
      dl,
      "coloridentity",
      applyFilterCallback
    );
    const superTypeFilter = new FilterDropdown(
      dl,
      "supertype",
      applyFilterCallback
    );
    const typeFilter = new FilterDropdown(dl, "type", applyFilterCallback);
    const subTypeFilter = new FilterDatalist(
      dl,
      "subtype",
      applyFilterCallback
    );
    const strengthFilter = new FilterNumberRange(
      dl,
      "power",
      applyFilterCallback
    );
    const toughnessFilter = new FilterNumberRange(
      dl,
      "toughness",
      applyFilterCallback
    );
    const cmcFilter = new FilterNumberRange(dl, "cmc", applyFilterCallback);
    const legalityFilter = new FilterDropdown(
      dl,
      "legality",
      applyFilterCallback
    );
    this.miscFilter = new FilterMiscOptions(dl, "misc", applyFilterCallback);

    this.allFilters = [
      this.nameFilter,
      textFilter,
      rarityFilter,
      setFilter,
      colorFilter,
      colorIdentityFilter,
      superTypeFilter,
      typeFilter,
      subTypeFilter,
      strengthFilter,
      toughnessFilter,
      cmcFilter,
      legalityFilter,
      this.miscFilter,
    ];

    document
      .querySelectorAll("#filterSelection > div > ul > li")
      .forEach((ele) => {
        ele.addEventListener("click", (e) => {
          const item = e.currentTarget as HTMLElement;
          const type = item.getAttribute("data-filtertype") || "";
          if (type === "clearall") {
            document
              .querySelectorAll(
                "#filterSelection > div > ul > li[data-active=true]"
              )
              .forEach((ele) => {
                (ele as HTMLElement).click();
              });
          } else if (type === "showall") {
            document
              .querySelectorAll(
                "#filterSelection > div > ul > li[data-active=false]:not(data-control)"
              )
              .forEach((ele) => {
                (ele as HTMLElement).click();
              });
          } else {
            item.setAttribute(
              "data-active",
              "" + (item.getAttribute("data-active") === "false")
            );
            const filter = this.GetFilterByType(type);
            if (item.getAttribute("data-active") === "true") {
              filter.show();
            } else {
              filter.hide();
            }
          }
        });
      });

    this.dl.onLoadedCB("FrontIDToBackID", () => {
      const frontIDToBackID = this.dl.getMapData("FrontIDToBackID");
      for (const front in frontIDToBackID) {
        const back = frontIDToBackID[front];
        this.bannedCards[back] = true;
      }
      console.log("Banned cards loaded");
    });
  }

  public GetFilterByType(type: string): BaseFilter {
    for (const filter of this.allFilters) {
      if (filter.type === type) {
        return filter;
      }
    }
    return this.allFilters[0];
  }

  public GetNameFilter(): FilterText {
    return this.nameFilter;
  }

  public GetMiscFilter(): FilterMiscOptions {
    return this.miscFilter;
  }

  public GetMiscOptions(): MiscOptions {
    return this.miscFilter.getMiscValues();
  }

  public ApplyFilter(): void {
    const sortedFilters = this.allFilters
      .filter((filter) => {
        return filter.ready && filter.active && filter.getValues().length > 0;
      })
      .sort((a, b) => {
        if (a.getWeight() > b.getWeight()) {
          return 1;
        }
        return -1;
      });

    if (sortedFilters.length === 0) {
      return;
    }
    this.cardIds = [];
    sortedFilters[0].apply(this.cardIds, true);
    for (
      let filterIndex = 1;
      filterIndex < sortedFilters.length;
      filterIndex++
    ) {
      sortedFilters[filterIndex].apply(this.cardIds, false);
    }

    if (
      this.dl.isDoneLoading("SetCodeToRelease") &&
      this.dl.isDoneLoading("IDToSetCode")
    ) {
      const setCodeToRelease = this.dl.getMapData("SetCodeToRelease");
      const idToSetCode = this.dl.getMapData("IDToSetCode");
      if (setCodeToRelease && idToSetCode) {
        this.cardIds.sort((a: string, b: string) => {
          return setCodeToRelease[idToSetCode[a]] <
            setCodeToRelease[idToSetCode[b]]
            ? 1
            : -1;
        });
      }
    }

    this.cardIds = this.cardIds.filter((id) => {
      return !this.bannedCards[id];
    });

    const miscOptions = this.GetMiscOptions();
    this.cardChangeCB(this.cardIds, miscOptions);
  }
}

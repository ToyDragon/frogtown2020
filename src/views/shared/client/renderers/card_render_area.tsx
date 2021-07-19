import { DataLoader } from "../data_loader";

import { CardSearchBehavior } from "../cardsearch_behavior";
import { FilterDisplayOptions } from "../cardfilters/filter_display_options";
import { FilterText } from "../cardfilters/filter_text";
import { FilterDropdownDataMap } from "../cardfilters/filter_dropdown_datamap";
import {
  FilterMiscOptions,
  MiscOptions,
} from "../cardfilters/filter_misc_options";

import { BaseCardRenderer } from "./base_card_renderer";
import { MapData } from "../../data_map_types";
import { BaseFilter } from "../cardfilters/base_filter";
import { setCookie, getCookie } from "../cookies";

export class CardRenderArea {
  private cardSearchUtil: CardSearchBehavior | null;
  private availableRenderers: BaseCardRenderer[];
  private deckDisplayGroupers!: FilterDropdownDataMap;
  private deckDisplayDropdown!: FilterDisplayOptions;
  private activeGrouper!: keyof MapData | "";
  private defaultOptions: MiscOptions;
  private allFilters!: BaseFilter[];
  private nameFilter!: FilterText;
  private miscFilter!: FilterMiscOptions;
  private ixIdentifier: string;

  private cardList!: string[];

  public activeRenderer: BaseCardRenderer;

  public constructor(
    dl: DataLoader,
    availableRenderers: BaseCardRenderer[],
    grouperKey: string,
    displayKey: string,
    defaultOptions: MiscOptions,
    cardSearchUtil: CardSearchBehavior | null,
    identifier: string
  ) {
    this.cardSearchUtil = cardSearchUtil;
    this.availableRenderers = availableRenderers;
    this.ixIdentifier = identifier;
    const ix = this.GetDefaultRendererIndex();
    this.activeRenderer = availableRenderers[ix];
    this.activeRenderer.Initialize();
    this.defaultOptions = defaultOptions;

    if (grouperKey) {
      this.deckDisplayGroupers = new FilterDropdownDataMap(
        dl,
        grouperKey,
        () => {
          this.UpdateDisplayType();
        }
      );
    }
    if (displayKey) {
      this.deckDisplayDropdown = new FilterDisplayOptions(
        dl,
        displayKey,
        ix,
        () => {
          this.UpdateDisplayType();
        },
        this.availableRenderers.map((renderer) => {
          return {
            title: renderer.GetDisplayName(),
            requiredMaps: [], //renderer.GetRequiredMaps() //TODO remove this
          };
        })
      );
    }

    dl.onLoadedCB("IDToImage", () => {
      this.UpdateDisplayedCards();
    });
  }

  private GetDefaultRendererIndex(): number {
    if (this.ixIdentifier) {
      return Number(getCookie(this.ixIdentifier)) || 0;
    }
    return 0;
  }

  private SetDefaultRendererIndex(ix: number): void {
    if (this.ixIdentifier) {
      setCookie(this.ixIdentifier, ix + "");
    }
  }

  public GetMiscFilter(): FilterMiscOptions {
    return this.miscFilter;
  }

  public GetNameFilter(): FilterText {
    return this.nameFilter;
  }

  public GetAllFilters(): BaseFilter[] {
    return this.allFilters;
  }

  public GetMiscOptions(): MiscOptions {
    let miscOptions: MiscOptions = {};
    if (this.cardSearchUtil) {
      miscOptions = this.cardSearchUtil.GetMiscOptions();
    }
    for (const key in this.defaultOptions as Record<string, unknown>) {
      // eslint-disable-next-line no-prototype-builtins
      if (this.defaultOptions.hasOwnProperty(key)) {
        (miscOptions as Record<string, unknown>)[key] = (this
          .defaultOptions as Record<string, unknown>)[key];
      }
    }
    if (this.activeGrouper) {
      miscOptions["Group Map"] = this.activeGrouper;
    }
    const requiredOptions = this.activeRenderer.RequiredMiscOptions();
    for (const option of requiredOptions) {
      ((miscOptions as unknown) as Record<keyof MiscOptions, boolean>)[
        option
      ] = true;
    }
    return miscOptions;
  }

  public UpdateCardList(cardList: string[]): void {
    this.cardList = cardList;
    console.log(`Updated to card list with ${cardList.length} items`);
    console.log(this.GetMiscOptions());
    this.activeRenderer.ChangeCardSet(this.cardList, this.GetMiscOptions());
    this.activeRenderer.UpdateDisplayedCards();
  }

  public UpdateDisplayType(): void {
    const types = this.deckDisplayDropdown.getValues();
    if (types.length === 0) {
      this.deckDisplayDropdown.resetDefault();
      return;
    }
    let selectedRenderer = null;
    let selectedRendererIndex = 0;
    for (const renderer of this.availableRenderers) {
      if (renderer.GetDisplayName() === types[0]) {
        selectedRenderer = renderer;
        break;
      }
      selectedRendererIndex++;
    }
    if (!selectedRenderer) {
      this.deckDisplayDropdown.resetDefault();
      return;
    }

    let selectedGrouper: keyof MapData | "" = "";
    if (this.deckDisplayGroupers) {
      const grouperValues = this.deckDisplayGroupers.getValues() as (keyof MapData)[];
      if (grouperValues) {
        selectedGrouper = grouperValues[0];
      }
    }

    if (
      selectedRenderer !== this.activeRenderer ||
      this.activeGrouper !== selectedGrouper
    ) {
      if (this.activeRenderer) {
        this.activeRenderer.Cleanup();
      }
      this.activeRenderer = selectedRenderer;
      this.SetDefaultRendererIndex(selectedRendererIndex);
      this.activeRenderer.Initialize();

      this.activeGrouper = selectedGrouper;
      this.activeRenderer.ChangeCardSet(this.cardList, this.GetMiscOptions());
      this.activeRenderer.UpdateDisplayedCards();
    }
  }

  public UpdateDisplayedCards(): void {
    this.activeRenderer.UpdateDisplayedCards();
  }
}

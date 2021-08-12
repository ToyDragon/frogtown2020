import { BlobStorageDataLoader } from "../shared/client/blob_storage_data_loader";
import { MiscOptions } from "../shared/client/cardfilters/filter_misc_options";
import { FilterText } from "../shared/client/cardfilters/filter_text";
import {
  BaseCardRenderer,
  CardRendererOptions,
} from "../shared/client/renderers/base_card_renderer";
import { CardRendererCompactDetails } from "../shared/client/renderers/card_renderer_compact_details";
import { CardRendererCompactGrid } from "../shared/client/renderers/card_renderer_compact_grid";
import { CardRendererCompactList } from "../shared/client/renderers/card_renderer_compact_list";
import { CardRendererGrid } from "../shared/client/renderers/card_renderer_grid";
import { CardRenderArea } from "../shared/client/renderers/card_render_area";

export class AlternateArtPane {
  private dl: BlobStorageDataLoader;
  private altPaneRenderArea!: CardRenderArea;
  private searchOptions!: CardRendererOptions;
  private cardRenderers: BaseCardRenderer[] = [];
  private actionHandler: (action: string, cardId: string) => void;
  private nameFilter: FilterText;

  constructor(
    dl: BlobStorageDataLoader,
    actionHandler: (action: string, cardId: string) => void
  ) {
    this.actionHandler = actionHandler;
    this.dl = dl;
    this.nameFilter = new FilterText(this.dl, "name", () => {}, {
      dataMapName: "",
      idMapName: "IDToName",
      dynamicOptions: false,
      excludedOptions: {},
      filterClass: "",
    });
  }

  altPaneSearchOptions: MiscOptions = {
    "Action Add": true,
    "Action ReplaceAll": true,
    "Show Duplicates": true,
  };

  updateCards(): void {
    this.altPaneRenderArea.UpdateDisplayedCards();
  }

  ready(): void {
    document.getElementById("exitIcon")?.addEventListener("click", () => {
      this.close();
    });
    document.getElementById("altDim")?.addEventListener("click", () => {
      this.close();
    });

    this.searchOptions = {
      dataLoader: this.dl,
      cardArea: document.getElementById("altPaneCardArea")!,
      scrollingParent: document.getElementById("altPaneSearch")!,
      allowEdit: true,
      actionHandler: this.actionHandler,
    };

    this.cardRenderers = [
      new CardRendererGrid(this.searchOptions),
      new CardRendererCompactList(this.searchOptions),
      new CardRendererCompactDetails(this.searchOptions),
      new CardRendererCompactGrid(this.searchOptions),
    ];

    this.altPaneRenderArea = new CardRenderArea(
      this.dl,
      this.cardRenderers,
      "",
      "",
      this.altPaneSearchOptions,
      null,
      ""
    );
  }

  public async open(name: string): Promise<void> {
    document.getElementById("altPaneSearch")!.scrollTop = 0;
    const cardIds: string[] = [];
    this.nameFilter.setValue(name);
    this.nameFilter.apply(cardIds, true, {
      "Strict Matching": true,
    });

    if (
      this.dl.isDoneLoading("SetCodeToRelease") &&
      this.dl.isDoneLoading("IDToSetCode")
    ) {
      const setCodeToRelease = this.dl.getMapData("SetCodeToRelease");
      const idToSetCode = this.dl.getMapData("IDToSetCode");
      if (setCodeToRelease && idToSetCode) {
        cardIds.sort((a: string, b: string) => {
          return setCodeToRelease[idToSetCode[a]] <
            setCodeToRelease[idToSetCode[b]]
            ? 1
            : -1;
        });
      }
    }
    this.altPaneRenderArea.UpdateCardList(cardIds);
    document.getElementById("altPane")!.style.visibility = "visible";
  }

  public async close(): Promise<void> {
    document.getElementById("altPane")!.style.visibility = "hidden";
  }
}

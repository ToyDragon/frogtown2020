import * as ReactDom from "react-dom";
import * as React from "react";
import ViewBehavior from "../shared/client/view_behavior";
import {
  DataInfoResponse,
  ProgressResponse,
  OptionalProgressResponse,
  CardImageInfoResponse,
  CardImageUpdateProgressResponse,
  ImageInfo,
  MissingSetSVGsResponse,
  CardImageClearInfoRequest,
} from "./types";
import { post } from "../shared/client/request";
import { wait } from "../../shared/utils";

class ToolsBehavior extends ViewBehavior<unknown> {
  public cardIdsToDownloadImagesFor: string[] | null = null;
  public cardIdsAlreadyDownloadedImagesFor: Record<string, boolean> = {};

  public async updateDisplay(): Promise<void> {
    const result = await post<unknown, DataInfoResponse>(
      "/tools/get_data_info",
      {}
    );

    this.updateAllCardsFromDataInfo(result);
    this.updateDataMapsFromDataInfo(result);
    this.updateCardImageInfo();
    this.updateImageVersionInfo();
    this.updateClearImageInfo();
  }

  private async updateCardImageInfo(): Promise<void> {
    const ele = document.querySelector("#divCardImageInfo");
    const result = await post<unknown, CardImageInfoResponse>(
      "/tools/get_card_image_info",
      {}
    );
    if (result && ele) {
      this.cardIdsToDownloadImagesFor = result.cardsNotHQWithHQAvailable
        .filter((a) => {
          return !this.cardIdsAlreadyDownloadedImagesFor[a];
        })
        .slice(0, 1000);
      if (
        this.cardIdsToDownloadImagesFor.length < 1000 &&
        result.cardsMissingWithLQAvailable
      ) {
        const lqCards = result.cardsMissingWithLQAvailable
          .filter((a) => {
            return !this.cardIdsAlreadyDownloadedImagesFor[a];
          })
          .slice(0, 1000 - this.cardIdsToDownloadImagesFor.length);
        for (const cardId of lqCards) {
          this.cardIdsToDownloadImagesFor.push(cardId);
        }
      }
      console.log("Cards to update: ");
      console.log(this.cardIdsToDownloadImagesFor);
      const btnDownloadSomeCards = document.querySelector(
        "#btnDownloadSomeCards"
      );
      if (btnDownloadSomeCards) {
        if (this.cardIdsToDownloadImagesFor.length === 0) {
          btnDownloadSomeCards.setAttribute("disabled", "true");
        } else {
          btnDownloadSomeCards.removeAttribute("disabled");
        }
      }
      ReactDom.render(
        <span>
          Card images last updated{" "}
          <span className="inlinedata">
            {result.lastUpdateDate
              ? new Date(result.lastUpdateDate).toLocaleString()
              : "never"}
          </span>
          , with{" "}
          <span className="inlinedata">
            {result.countByType[ImageInfo.MISSING]} Missing
          </span>
          ,{" "}
          <span className="inlinedata">
            {result.countByType[ImageInfo.NONE]} With No Image
          </span>
          ,{" "}
          <span className="inlinedata">
            {result.countByType[ImageInfo.LQ]} Low Quality
          </span>
          , and{" "}
          <span className="inlinedata">
            {result.countByType[ImageInfo.HQ]} High Quality
          </span>
          . There are{" "}
          <span className="inlinedata">
            {result.cardsNotHQWithHQAvailable.length} HQ available
          </span>{" "}
          cards, and{" "}
          <span className="inlinedata">
            {result.cardsMissingWithLQAvailable.length} LQ available
          </span>{" "}
          cards .
        </span>,
        ele
      );
    }
  }

  private async updateAllCardsFromDataInfo(
    dataInfo: DataInfoResponse | null
  ): Promise<void> {
    const ele = document.querySelector("#divAllCardsInfo");
    if (!dataInfo) {
      ReactDom.render(<span>Unable to load database details.</span>, ele);
      return;
    }

    if (!dataInfo.allCardsUpdateDate || !dataInfo.allCardsChangeDate) {
      ReactDom.render(
        <span>
          No AllCards file present. New file available with change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsNextChangeDate).toLocaleString()}
          </span>
        </span>,
        ele
      );
    } else {
      ReactDom.render(
        <span>
          AllCards file updated{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsUpdateDate).toLocaleString()}
          </span>
          , with last change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsChangeDate).toLocaleString()}
          </span>
          . New file available with change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsNextChangeDate).toLocaleString()}
          </span>
        </span>,
        ele
      );
    }

    if (dataInfo.allCardsUpdateInProgress) {
      const btnUpdateAllCards = document.querySelector(
        "#btnUpdateAllCardsFile"
      );
      btnUpdateAllCards!.setAttribute("disabled", "true");
      this.updateAllCardsProgress();
    }
  }

  public async updateAllCardsProgress(): Promise<void> {
    const btnUpdateAllCards = document.querySelector("#btnUpdateAllCardsFile");
    const divUpdateAllCardsProgress = document.querySelector(
      "#divUpdateAllCardsProgress"
    );
    if (!btnUpdateAllCards || !divUpdateAllCardsProgress) {
      return;
    }
    const response = await post<unknown, ProgressResponse>(
      "/tools/all_cards_progress",
      {}
    );
    if (response && response.progress >= 1.0) {
      await wait(1000);
      divUpdateAllCardsProgress.innerHTML = "";
      this.updateDisplay();
      return;
    }

    if (response) {
      ReactDom.render(
        <span>
          Progress:{" "}
          <span className="inlinedata">
            {Math.floor(response.progress * 100)}%
          </span>
        </span>,
        divUpdateAllCardsProgress
      );
    }

    await wait(250);
    this.updateAllCardsProgress();
  }

  private async updateClearImageInfo(): Promise<void> {
    const btnClearSetImages = document.querySelector<HTMLButtonElement>(
      "#btnClearSetImages"
    );
    const textareaSets = document.querySelector<HTMLTextAreaElement>(
      "#textareaSetsToClear"
    );
    if (!textareaSets || !btnClearSetImages) {
      return;
    }
    btnClearSetImages.addEventListener("click", async () => {
      const sets = textareaSets.value.split("\n");
      textareaSets.value = "";
      await post<CardImageClearInfoRequest, unknown>(
        "/tools/clear_image_info",
        {
          sets: sets,
        }
      );
      console.log("Done clearing image infos.");
    });
  }

  private async updateImageVersionInfo(): Promise<void> {
    const ele = document.querySelector("#divCardImageVersionInfo");
    if (!this.dl.getDataDetails()) {
      ReactDom.render(<span>Unable to load database details.</span>, ele);
      return;
    }
    ReactDom.render(
      <span>
        Card image version{" "}
        <span className="inlinedata">
          {this.dl.getDataDetails()!.imageVersion.version}
        </span>
        , last updated{" "}
        <span className="inlinedata">
          {new Date(
            this.dl.getDataDetails()!.imageVersion.change
          ).toLocaleString()}
        </span>
        .
      </span>,
      ele
    );
  }

  private async updateDataMapsFromDataInfo(
    dataInfo: DataInfoResponse | null
  ): Promise<void> {
    const ele = document.querySelector("#divDataMapsInfo");
    if (!dataInfo) {
      ReactDom.render(<span>Unable to load database details.</span>, ele);
      return;
    }

    if (
      !dataInfo.dataMapsUpdateDate ||
      !dataInfo.dataMapsChangeDate ||
      !dataInfo.allCardsChangeDate ||
      !dataInfo.allCardsS3Date
    ) {
      ReactDom.render(
        <span>
          No data maps present. New file available with change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsNextChangeDate).toLocaleString()}
          </span>
        </span>,
        ele
      );
    } else {
      ReactDom.render(
        <span>
          Data maps updated{" "}
          <span className="inlinedata">
            {new Date(dataInfo.dataMapsUpdateDate).toLocaleString()}
          </span>
          , with last change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.dataMapsChangeDate).toLocaleString()}
          </span>
          . New file available with change made{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsChangeDate).toLocaleString()}
          </span>
          . S3 version updated{" "}
          <span className="inlinedata">
            {new Date(dataInfo.allCardsS3Date).toLocaleString()}
          </span>
        </span>,
        ele
      );
    }

    if (dataInfo.dataMapsUpdateInProgress) {
      const btnUpdateDataMaps = document.querySelector("#btnUpdateDataMaps");
      btnUpdateDataMaps!.setAttribute("disabled", "true");
      this.updateDataMapsProgress();
    }
  }

  public async updateDataMapsProgress(): Promise<void> {
    const btnUpdateDataMaps = document.querySelector("#btnUpdateDataMaps");
    const divUpdateDataMapsProgress = document.querySelector(
      "#divUpdateDataMapsProgress"
    );
    if (!btnUpdateDataMaps || !divUpdateDataMapsProgress) {
      return;
    }
    const response = await post<unknown, OptionalProgressResponse>(
      "/tools/data_maps_progress",
      {}
    );
    if (response && response.progress === null) {
      await wait(1000);
      divUpdateDataMapsProgress.innerHTML = "";
      this.updateDisplay();
      return;
    }

    if (response) {
      ReactDom.render(
        <span>
          Progress: <span className="inlinedata">{response.progress}</span>
        </span>,
        divUpdateDataMapsProgress
      );
    }

    await wait(250);
    this.updateDataMapsProgress();
  }

  public async ready(): Promise<void> {
    await this.updateDisplay();

    const btnIncrementImageVersion = document.querySelector(
      "#btnIncrementImageVersion"
    );
    if (btnIncrementImageVersion) {
      btnIncrementImageVersion.addEventListener("click", async () => {
        await post("/tools/increment_image_version", {});
        location.reload();
      });
    }

    const btnUpdateAllCards = document.querySelector("#btnUpdateAllCardsFile");
    if (btnUpdateAllCards) {
      btnUpdateAllCards.addEventListener("click", () => {
        post("/tools/start_download_all_cards_file", {});
        btnUpdateAllCards.setAttribute("disabled", "true");
        this.updateAllCardsProgress();
      });
    }

    const btnUpdateDataMaps = document.querySelector("#btnUpdateDataMaps");
    if (btnUpdateDataMaps) {
      btnUpdateDataMaps.addEventListener("click", () => {
        post("/tools/start_construct_all_data_maps", {});
        btnUpdateDataMaps.setAttribute("disabled", "true");
        this.updateAllCardsProgress();
      });
    }

    const btnDownloadSomeCards = document.querySelector(
      "#btnDownloadSomeCards"
    );
    if (btnDownloadSomeCards) {
      btnDownloadSomeCards.setAttribute("disabled", "true");
      btnDownloadSomeCards.addEventListener("click", () => {
        if (this.cardIdsToDownloadImagesFor) {
          for (const cardId of this.cardIdsToDownloadImagesFor) {
            this.cardIdsAlreadyDownloadedImagesFor[cardId] = true;
          }
        }
        post("/tools/start_image_update", {
          allMissingCards: false,
          cardIds: this.cardIdsToDownloadImagesFor,
        });
        btnDownloadSomeCards.setAttribute("disabled", "true");
        this.updateAllCardsProgress();
        const updateInterval = setInterval(() => {
          post<unknown, CardImageUpdateProgressResponse>(
            "/tools/get_image_update_progress",
            {}
          ).then((progress) => {
            if (progress) {
              const divUpdateImagesProgress = document.querySelector(
                "#divUpdateImagesProgress"
              );
              if (divUpdateImagesProgress) {
                ReactDom.render(
                  <span>
                    Progress:{" "}
                    <span className="inlinedata">
                      {progress.position + "/" + progress.max}
                    </span>
                  </span>,
                  divUpdateImagesProgress
                );
              }
            } else {
              clearInterval(updateInterval);
            }
          });
        }, 3000);
      });
    }

    this.updateMissingSetSVGs();
    const btnDownloadSetSVGs = document.querySelector("#btnDownloadSVGs");
    btnDownloadSetSVGs?.addEventListener("click", async () => {
      await post("/tools/download_missing_set_svgs", {});
      this.updateMissingSetSVGs();
    });
  }

  private async updateMissingSetSVGs(): Promise<void> {
    const result = await post<unknown, MissingSetSVGsResponse>(
      "/tools/get_missing_set_svgs",
      {}
    );
    const btnDownloadSetSVGs = document.querySelector("#btnDownloadSVGs");
    const spanMissingSetSVGs = document.querySelector("#spanMissingSetSVGs");
    if (spanMissingSetSVGs && result && btnDownloadSetSVGs) {
      spanMissingSetSVGs.innerHTML = result.sets.length + " Missing";
      if (result.sets.length) {
        btnDownloadSetSVGs.removeAttribute("disabled");
      } else {
        btnDownloadSetSVGs.setAttribute("disabled", "true");
      }
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new ToolsBehavior();
behavior;

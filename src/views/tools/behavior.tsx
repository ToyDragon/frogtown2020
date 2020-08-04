import * as ReactDom from "react-dom";
import * as React from "react";
import ViewBehavior from "../shared/client/view_behavior";
import {
  DataInfoResponse,
  ProgressResponse,
  OptionalProgressResponse,
} from "./types";
import { post } from "../shared/client/request";
import { wait } from "../../shared/utils";

class ToolsBehavior extends ViewBehavior {
  public async updateDisplay(): Promise<void> {
    const result = await post<unknown, DataInfoResponse>(
      "/tools/get_data_info",
      {}
    );

    this.updateAllCardsFromDataInfo(result);
    this.updateDataMapsFromDataInfo(result);
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
      !dataInfo.allCardsChangeDate
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
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new ToolsBehavior();
behavior;

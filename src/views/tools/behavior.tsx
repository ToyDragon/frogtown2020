import * as ReactDom from "react-dom";
import * as React from "react";
import ViewBehavior from "../shared/client/view_behavior";
import { DataInfoResponse, ProgressResponse } from "./types";
import { post } from "../shared/client/request";
import { wait } from "../../shared/utils";

class ToolsBehavior extends ViewBehavior {
  public async updateDataMapsDisplay(): Promise<void> {
    let ele = document.querySelector("#divAllCardsInfo");
    const result = await post<unknown, DataInfoResponse>(
      "/tools/get_data_info",
      {}
    );

    if (!result) {
      ReactDom.render(<span>Unable to load database details.</span>, ele);
      return;
    }

    if (!result.allCardsUpdateDate || !result.allCardsChangeDate) {
      ReactDom.render(
        <span>
          No AllCards file present. New file available with change made{" "}
          <span className="inlinedata">
            {new Date(result.allCardsNextChangeDate).toLocaleString()}
          </span>
        </span>,
        ele
      );
    } else {
      ReactDom.render(
        <span>
          AllCards file updated{" "}
          <span className="inlinedata">
            {new Date(result.allCardsUpdateDate).toLocaleString()}
          </span>
          , with last change made{" "}
          <span className="inlinedata">
            {new Date(result.allCardsChangeDate).toLocaleString()}
          </span>
          . New file available with change made{" "}
          <span className="inlinedata">
            {new Date(result.allCardsNextChangeDate).toLocaleString()}
          </span>
        </span>,
        ele
      );
    }

    ele = document.querySelector("#divDataMapsInfo");
    if (!result.dataMapsUpdateDate) {
      ReactDom.render(<span>No data maps present.</span>, ele);
    } else {
      ReactDom.render(
        <span>
          Data maps last updated{" "}
          <span className="inlinedata">
            {new Date(result.dataMapsUpdateDate).toLocaleString()}
          </span>
          .
        </span>,
        ele
      );
    }

    if (result.allCardsUpdateInProgress) {
      const btnUpdateAllCards = document.querySelector("#btnUpdateAllCardsFile");
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
      this.updateDataMapsDisplay();
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

  public async ready(): Promise<void> {
    await this.updateDataMapsDisplay();

    const btnUpdateAllCards = document.querySelector("#btnUpdateAllCardsFile");
    if (btnUpdateAllCards) {
      btnUpdateAllCards.addEventListener("click", () => {
        post("/tools/start_download_all_cards_file", {});
        btnUpdateAllCards.setAttribute("disabled", "true");
        this.updateAllCardsProgress();
      });
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new ToolsBehavior();
behavior;

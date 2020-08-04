import * as express from "express";
import Services from "../../server/services";
import { addEndpoint } from "../../shared/utils";
import * as DataManagement from "./data_management";
import {
  DataInfoResponse,
  ProgressResponse,
  OptionalProgressResponse,
} from "./types";

/**
 * Router that handles requests available outside of the context
 * of a single page.
 * @param {Services} services
 */
export default function handler(services: Services): express.Router {
  const router = express.Router();

  addEndpoint<DataInfoResponse>(router, "/get_data_info", async () => {
    return await DataManagement.getDataInfo(services);
  });

  addEndpoint<void>(router, "/start_download_all_cards_file", async () => {
    await DataManagement.startDownloadNewAllCardsFile(services);
  });

  addEndpoint<ProgressResponse>(router, "/all_cards_progress", async () => {
    return {
      progress: await DataManagement.getAllCardsFileProgress(services),
    };
  });

  addEndpoint<void>(router, "/start_construct_all_data_maps", async () => {
    await DataManagement.startConstructingDataMaps(services);
  });

  addEndpoint<OptionalProgressResponse>(
    router,
    "/data_maps_progress",
    async () => {
      return {
        progress: DataManagement.getMapConstructionProgress(),
      };
    }
  );

  return router;
}

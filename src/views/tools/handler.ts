import * as express from "express";
import Services from "../../server/services";
import { addEndpoint, addEndpointWithParams } from "../../shared/utils";
import * as DataManagement from "./data_management";
import * as ImageManagement from "./image_management";
import {
  DataInfoResponse,
  ProgressResponse,
  OptionalProgressResponse,
  CardImageInfoResponse,
  CardImageUpdateStartRequest,
  CardImageUpdateProgressResponse,
  MissingSetSVGsResponse,
  CardImageClearInfoRequest,
} from "./types";
import {
  getImageVersionDetails,
  setImageVersion,
} from "../shared/server/image_version";
import { logInfo } from "../../server/log";
import { getSetsMissingSVG, downloadMissingSVGs } from "./svg_management";

// Router that handles requests available outside of the context
// of a single page.
export default function handler(services: Services): express.Router {
  const router = express.Router();

  // Drop all requests unless they come from the admin user.
  router.use((req, res, next) => {
    if (req.cookies["privateId"] === services.config.adminId) {
      next();
    } else {
      res.end();
    }
  });

  addEndpoint<DataInfoResponse>(
    router,
    "/get_data_info",
    async (_userDetails) => {
      return await DataManagement.getDataInfo(services);
    }
  );

  addEndpoint<void>(
    router,
    "/start_download_all_cards_file",
    async (_userDetails) => {
      await DataManagement.startDownloadNewAllCardsFile(services);
    }
  );

  addEndpoint<ProgressResponse>(
    router,
    "/all_cards_progress",
    async (_userDetails) => {
      return {
        progress: await DataManagement.getAllCardsFileProgress(services),
      };
    }
  );

  addEndpoint<void>(
    router,
    "/start_construct_all_data_maps",
    async (_userDetails) => {
      await DataManagement.startConstructingDataMaps(services);
    }
  );

  addEndpoint<OptionalProgressResponse>(
    router,
    "/data_maps_progress",
    async (_userDetails) => {
      return {
        progress: await DataManagement.getMapConstructionProgress(services),
      };
    }
  );

  addEndpoint<CardImageInfoResponse>(
    router,
    "/get_card_image_info",
    async (_userDetails) => {
      return await ImageManagement.getAllImageInfos(services);
    }
  );

  addEndpoint<boolean>(
    router,
    "/increment_image_version",
    async (_userDetails) => {
      const version = await getImageVersionDetails(services);
      logInfo("Setting image version to " + (version.version + 1));
      await setImageVersion(services, version.version + 1);
      return true;
    }
  );

  addEndpointWithParams<CardImageUpdateStartRequest, void>(
    router,
    "/start_image_update",
    async (_userDetails, request) => {
      return await ImageManagement.startUpdatingImages(services, request);
    }
  );

  addEndpoint<CardImageUpdateProgressResponse>(
    router,
    "/get_image_update_progress",
    async (_userDetails) => {
      return await ImageManagement.getImageUpdateProgress(services);
    }
  );

  addEndpoint<MissingSetSVGsResponse>(
    router,
    "/get_missing_set_svgs",
    async (_userDetails) => {
      return {
        sets: await getSetsMissingSVG(services),
      };
    }
  );

  addEndpoint(router, "/download_missing_set_svgs", async (_userDetails) => {
    await downloadMissingSVGs(services);
  });

  addEndpointWithParams<CardImageClearInfoRequest, void>(
    router,
    "/clear_image_info",
    async (_userDetails, request) => {
      return await ImageManagement.clearImageInfo(services, request);
    }
  );

  return router;
}

import * as express from "express";
import Services from "../../../server/services";
import { addEndpoint } from "../../../shared/utils";
import { createNewUser } from "./authentication";
import {
  NewUserResponse,
  DataDetailsResponse,
  ToolbarNewDeckResponse,
} from "../handler_types";
import { getDataDetails } from "./data_details";
import createNewDeck from "./deck_creator";

/**
 * Router that handles requests available outside of the context
 * of a single page.
 * @param {Services} services
 */
export default function handler(services: Services): express.Router {
  const router = express.Router();

  addEndpoint<NewUserResponse>(
    router,
    "/authentication/newuser",
    async (_userDetails) => {
      return await createNewUser(services);
    }
  );

  addEndpoint<DataDetailsResponse>(
    router,
    "/data/details",
    async (_userDetails) => {
      return await getDataDetails(services);
    }
  );

  addEndpoint<ToolbarNewDeckResponse>(
    router,
    "/toolbar/newdeck",
    async (userDetails) => {
      return await createNewDeck(userDetails, services);
    }
  );

  return router;
}

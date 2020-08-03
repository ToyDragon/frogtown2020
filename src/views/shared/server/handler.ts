import * as express from "express";
import Services from "../../../server/services";
import { addEndpoint } from "../../../shared/utils";
import { createNewUser } from "./authentication";
import { NewUserResponse } from "./types";

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
    async (_request) => {
      return await createNewUser(services);
    }
  );

  return router;
}

import * as express from "express";
import Services from "../../server/services";

/**
 * Router that handles page specific request.
 * @param {Services} _services
 */
export default function Handler(_services: Services): express.Router {
  const router = express.Router();
  return router;
}

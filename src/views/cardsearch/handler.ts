import * as express from "express";
import Services from "../../server/services";

// Router that handles page specific request.
export default function handler(_services: Services): express.Router {
  const router = express.Router();
  return router;
}

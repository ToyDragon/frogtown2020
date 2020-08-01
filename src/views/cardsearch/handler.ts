import * as express from "express";
import Config from "../../config";

export default function Handler(_config: Config): express.Router {
  const router = express.Router();
  return router;
}

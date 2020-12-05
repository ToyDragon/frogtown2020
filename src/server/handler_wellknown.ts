import * as express from "express";
import { logInfo } from "./log";
import Services from "./services";

// Creates route handler to serve well known files for SSL certs.
export default function WellKnownHandler(services: Services): express.Router {
  const router = express.Router();
  
  logInfo("Setting up well known handler");

  router.get("/\.well-known/acme-challenge/:name", async (req, res) => {
    logInfo("Handling well known request: " + req.params.name);
    const data = await services.storagePortal.getObjectAsString(services.config.storage.awsS3WellKnownBucket, req.params.name);
    res.end(data);
  });

  return router;
}

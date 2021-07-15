import * as express from "express";
import Services from "../../server/services";
import { addEndpoint } from "../../shared/utils";
import { SummaryData } from "../../server/services/performance_monitor/performance_monitor";

// Router that handles page specific request.
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

  addEndpoint<Record<string, SummaryData>>(
    router,
    "/get_performance_summary",
    async (_user) => {
      return services.perfMon.GetSummary();
    }
  );

  return router;
}

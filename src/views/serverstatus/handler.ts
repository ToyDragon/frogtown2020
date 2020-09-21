import * as express from "express";
import Services from "../../server/services";
import { addEndpoint, addEndpointWithParams } from "../../shared/utils";
import {
  ServerStatusResponse,
  Server,
  SetServerTargetStatusRequest,
} from "./types";
import { ServerStatus } from "../../server/database/dbinfos/db_info_server_status";
import { logWarning } from "../../server/log";

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

  addEndpointWithParams<SetServerTargetStatusRequest, void>(
    router,
    "/set_server_target_status",
    async (_user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return;
      }
      await connection.query(
        "UPDATE server_status SET target_status=? WHERE name=?;",
        [params.targetStatus, params.name]
      );
      logWarning(
        "Set target status of " + params.name + " to " + params.targetStatus
      );
      connection.release();
    }
  );

  addEndpoint<ServerStatusResponse>(
    router,
    "/get_server_status",
    async (_user) => {
      const servers: Server[] = [];
      const connection = await services.dbManager.getConnection();
      if (connection) {
        const result = await connection.query<
          {
            name: string;
            heartbeat: number;
            status: number;
            target_status: number;
            version: number;
          }[]
        >(
          "SELECT name, UNIX_TIMESTAMP(heartbeat) as heartbeat, status, target_status, version FROM server_status;",
          []
        );
        if (result?.value && result.value.length > 0) {
          for (const rawServer of result.value) {
            servers.push({
              name: rawServer.name,
              heartbeat: rawServer.heartbeat,
              status: rawServer.status + "-" + ServerStatus[rawServer.status],
              targetStatus:
                rawServer.target_status +
                "-" +
                ServerStatus[rawServer.target_status],
              version: rawServer.version,
            });
          }
        }

        connection.release();
      }

      return {
        servers: servers,
      };
    }
  );
  return router;
}

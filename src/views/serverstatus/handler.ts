import * as express from "express";
import Services from "../../server/services";
import { addEndpoint, addEndpointWithParams } from "../../shared/utils";
import {
  ServerStatusResponse,
  Server,
  SetServerTargetStatusRequest,
} from "./types";
import { ServerStatus } from "../../server/services/database/dbinfos/db_info_server_status";
import { logWarning } from "../../server/log";
import { BatchStatusRow } from "../../server/services/database/dbinfos/db_info_batch_status";

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
        `Set target status of ${params.name} to ${params.targetStatus}`
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
      let activeBatch = "";
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

        const batchResult = await connection.query<BatchStatusRow[]>(
          "SELECT * FROM batch_status WHERE name=?;",
          ["batch_owner_name"]
        );
        if (batchResult?.value && batchResult.value.length > 0) {
          activeBatch = batchResult.value[0].value;
        }

        connection.release();
      }

      return {
        servers: servers,
        batch_server: activeBatch,
      };
    }
  );
  return router;
}

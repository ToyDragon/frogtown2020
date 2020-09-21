import { logCritical, logInfo, logWarning } from "./log";
import Services from "./services";
import * as os from "os";
import { dateToMySQL } from "../shared/utils";
import {
  ServerStatus,
  ServerStatusRow,
} from "./database/dbinfos/db_info_server_status";
import { getVersion } from "./version";

let initialized = false;
const status = ServerStatus.Waiting;

function getName(label: string): string {
  return label + ":" + os.hostname();
}

async function heartbeat(label: string, services: Services): Promise<void> {
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return;
  }
  await connection.query("UPDATE server_status SET heartbeat=? WHERE name=?;", [
    dateToMySQL(new Date()),
    getName(label),
  ]);

  // Check for explicit shutdown request.
  const result = await connection.query<ServerStatusRow[]>(
    "SELECT * FROM server_status WHERE name=?;",
    [getName(label)]
  );
  let shouldShutdown = false;
  if (result?.value && result.value.length > 0) {
    const targetStatus = result.value[0].target_status;
    if (targetStatus === ServerStatus.Shutdown) {
      shouldShutdown = true;
      logWarning("Shutting down because of request status.");
    }
  }

  if (shouldShutdown) {
    await connection.query("UPDATE server_status SET status=? WHERE name=?;", [
      ServerStatus.Shutdown,
      getName(label),
    ]);
    connection.release();
    //TODO can we do this more gracefully?
    // eslint-disable-next-line no-process-exit
    process.exit(1); // 1 indicates that a new server should be spawned.
  } else {
    connection.release();
    logInfo("Server heartbeat.");
  }
}

export async function initStatusManagement(
  label: string,
  services: Services
): Promise<void> {
  if (initialized) {
    logCritical("Tried to initialize status manager more than once.");
    return;
  }
  initialized = true;

  const connection = await services.dbManager.getConnection();
  if (!connection) {
    logCritical("Failed to initialize heartbeat for server status.");
    return;
  }

  await connection.query(
    "REPLACE INTO server_status (name, heartbeat, version, status, target_status) VALUES (?,?,?,?,?);",
    [getName(label), dateToMySQL(new Date()), getVersion(), status, status]
  );
  connection.release();

  heartbeat(label, services);
  setInterval(() => {
    heartbeat(label, services);
  }, 60000);
}

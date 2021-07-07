import { logCritical } from "../log";
import { DBInfoBatchStatus } from "./dbinfos/db_info_batch_status";
import { DBInfoCardImages } from "./dbinfos/db_info_card_images";
import { DBInfoDataFiles } from "./dbinfos/db_info_data_files";
import { DBInfoDeckCards } from "./dbinfos/db_info_deck_cards";
import { DBInfoDeckKeys } from "./dbinfos/db_info_deck_keys";
import { DBInfoMetadata } from "./dbinfos/db_info_metadata";
import { DBInfoServerStatus } from "./dbinfos/db_info_server_status";
import { DBInfoUserKeys } from "./dbinfos/db_info_user_keys";
import { DBInfoUserQuality } from "./dbinfos/db_info_user_quality";
import DatabaseManager from "./db_manager";
import Config from "../config";

// Ensures that the frogtown database and tables exist.
export default async function initializeDatabase(
  manager: DatabaseManager,
  config: Config
): Promise<void> {
  // Database needs to be created before getConnection can succeed.
  if (!(await manager.ensureDatabaseExists(config))) {
    return;
  }

  // Verify we can establish a connection to the database.
  const connection = await manager.getConnectionTimeout(1000 * 60 * 60);
  if (!connection) {
    logCritical("Unable to ensure required database tables exist.");
    return;
  }

  const tablesInfos = [
    new DBInfoUserKeys(),
    new DBInfoDataFiles(),
    new DBInfoDeckKeys(),
    new DBInfoDeckCards(),
    new DBInfoCardImages(),
    new DBInfoBatchStatus(),
    new DBInfoMetadata(),
    new DBInfoUserQuality(),
    new DBInfoServerStatus(),
  ];

  for (const info of tablesInfos) {
    if (
      !(await info.ensureTableExists(
        connection,
        manager.getCreateTableSuffix()
      ))
    ) {
      connection.release();
      return;
    }
  }

  for (const info of tablesInfos) {
    const cmds = info.getUpdateCommands();
    for (const cmd of cmds) {
      if (!(await cmd(connection))) {
        connection.release();
        return;
      }
    }
  }

  connection.release();
}

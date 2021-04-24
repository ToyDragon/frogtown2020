import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";
import { logCritical, logInfo, logError } from "../log";
import { DatabaseActionResult } from "./db_action_result";
import { DBInfoUserKeys } from "./dbinfos/db_info_user_keys";
import { DBInfoDeckKeys } from "./dbinfos/db_info_deck_keys";
import { DBInfoDataFiles } from "./dbinfos/db_info_data_files";
import { DBInfoDeckCards } from "./dbinfos/db_info_deck_cards";
import { DBInfoCardImages } from "./dbinfos/db_info_card_images";
import { DBInfoBatchStatus } from "./dbinfos/db_info_batch_status";
import { DBInfoMetadata } from "./dbinfos/db_info_metadata";
import { DBInfoUserQuality } from "./dbinfos/db_info_user_quality";
import { DBInfoServerStatus } from "./dbinfos/db_info_server_status";

export default class DatabaseManager {
  private connectionPool: mysql.Pool;

  public constructor(config: Config) {
    const pw = fs.readFileSync(config.database.passwordFile).toString();
    const connectionOptions = {
      connectionLimit: 50,
      host: config.database.host,
      user: config.database.user,
      password: pw,
      database: "frogtown",
      multipleStatements: true,
    };

    this.connectionPool = mysql.createPool(connectionOptions);
  }

  // Helper method to promise-ize connection.query. We can't use poolconnection
  // here because this is not from a pool.
  private performQuery(
    con: mysql.Connection,
    query: string
  ): Promise<DatabaseActionResult<string[]>> {
    return new Promise((resolve) => {
      con.query(query, (err, result: string[]) => {
        resolve(new DatabaseActionResult(err, result));
      });
    });
  }

  // Ensures that the frogtown database exists.
  private async ensureDatabaseExists(config: Config): Promise<boolean> {
    // Setup database-less connection
    const pw = fs.readFileSync(config.database.passwordFile).toString();
    const connectionOptions = {
      connectionLimit: 50,
      host: config.database.host,
      user: config.database.user,
      password: pw,
      database: "",
    };
    const connection = mysql.createConnection(connectionOptions);

    // Check for existing database
    let cmd = `
      SELECT SCHEMA_NAME
        FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME = 'frogtown';
    `;
    let result = await this.performQuery(connection, cmd);
    if (result.err) {
      logCritical("Error checking for database.");
      return false;
    }
    if (result.value && result.value.length > 0) {
      logInfo("Database frogtown already exists.");
      return true;
    }

    // Create database
    cmd = `
      CREATE DATABASE IF NOT EXISTS frogtown;
    `;
    result = await this.performQuery(connection, cmd);
    if (result.err) {
      logCritical("Error creating frogtown database.");
      return false;
    }

    logInfo("Created frogtown database.");
    return true;
  }

  // Ensures that the frogtown database and tables exist.
  public async ensureDatabaseAndTablesExist(config: Config): Promise<void> {
    // Database needs to be created before getConnection can succeed.
    if (!(await this.ensureDatabaseExists(config))) {
      return;
    }

    // Verify we can establish a connection to the database.
    const connection = await this.getConnectionTimeout(1000 * 60 * 60);
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
      if (!(await info.ensureTableExists(connection))) {
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

    logInfo("Ensured tables exist.");
    connection.release();
  }

  // Retrieves a database connection from the connection pool.
  public getConnection(): Promise<DatabaseConnection | null> {
    // Default timeout 10 seconds
    return this.getConnectionTimeout(10000);
  }

  public getConnectionTimeout(
    timeoutMillis: number
  ): Promise<DatabaseConnection | null> {
    const debugStack = new Error().stack!;
    return new Promise<DatabaseConnection | null>((resolve) => {
      this.connectionPool.getConnection((err, rawConnection) => {
        if (err) {
          logError(err);
          resolve(null);
        } else {
          resolve(
            new DatabaseConnection(timeoutMillis, debugStack, rawConnection)
          );
        }
      });
    });
  }
}

import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";
import { logCritical, logInfo, logError } from "../log";
import { DatabaseActionResult } from "./db_action_result";

export interface DataFileRow {
  name: string;
  update_time: string;
  change_time: string;
}

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
    };

    this.connectionPool = mysql.createPool(connectionOptions);
  }

  /**
   * Helper method to promise-ize connection.query. We can't use poolconnection
   * here because this is not from a pool.
   * @param {mysql.Connection} con
   * @param {string} query
   */
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

  /**
   * Ensures that the frogtown database exists.
   * @param {Config} config
   */
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

  /**
   * Ensures that the frogtown database and tables exist.
   * @param {Config} config
   */
  public async ensureDatabaseAndTablesExist(config: Config): Promise<void> {
    // Database needs to be created before getConnection can succeed.
    if (!(await this.ensureDatabaseExists(config))) {
      return;
    }

    // Verify we can establish a connection to the database.
    const connection = await this.getConnection();
    if (!connection) {
      logCritical("Unable to ensure required database tables exist.");
      return;
    }

    // user_keys table
    let cmd = `
      CREATE TABLE IF NOT EXISTS user_keys(
        private_id VARCHAR(64) NOT NULL,
        public_id VARCHAR(24) NOT NULL,
        PRIMARY KEY(private_id),
        INDEX(private_id),
        INDEX(public_id)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    let result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      return;
    }

    // data_files table
    cmd = `
      CREATE TABLE IF NOT EXISTS data_files(
        name VARCHAR(64) NOT NULL,
        update_time DATETIME NOT NULL,
        change_time DATETIME NOT NULL,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      return;
    }

    logInfo("Ensured tables exist.");
  }

  /**
   * Retrieves a database connection from the connection pool.
   */
  public getConnection(): Promise<DatabaseConnection | null> {
    return new Promise<DatabaseConnection | null>((resolve) => {
      this.connectionPool.getConnection((err, rawConnection) => {
        if (err) {
          logError(err);
          resolve(null);
        } else {
          resolve(new DatabaseConnection(rawConnection));
        }
      });
    });
  }
}

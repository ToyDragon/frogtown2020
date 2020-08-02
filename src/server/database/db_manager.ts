import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";
import { logCritical, logInfo, logError } from "../log";
import { DatabaseActionResult } from "./db_action_result";

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
   * @param {mywql.Connection} con
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
      WHERE SCHEMA_NAME = 'frogtown'
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

    // Create the tables if they don't already exist
    const cmd = `
      CREATE TABLE IF NOT EXISTS user_keys(
        unique_key INT NOT NULL AUTO_INCREMENT,
        private_id VARCHAR(64) NOT NULL,
        public_id VARCHAR(24) NOT NULL,
        PRIMARY KEY(unique_key),
        INDEX(private_id),
        INDEX(public_id)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    const result = await connection.query(cmd, []);
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

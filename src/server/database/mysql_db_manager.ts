import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";
import { logCritical, logError, logInfo } from "../log";
import DatabaseManager, { RawDatabaseConnection } from "./db_manager";
import { DatabaseActionResult } from "./db_action_result";

export default class MySQLDatabaseManager implements DatabaseManager {
  private connectionPool: mysql.Pool;

  public constructor(config: Config) {
    const pw = fs.readFileSync(config.database.passwordFile).toString().trim();
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

  public async getRawDatabaseConnection(
    config: Config
  ): Promise<RawDatabaseConnection> {
    const pw = fs.readFileSync(config.database.passwordFile).toString();
    const connectionOptions = {
      connectionLimit: 50,
      host: config.database.host,
      user: config.database.user,
      password: pw,
      database: "",
    };
    const mysqlConnection = mysql.createConnection(connectionOptions);
    return {
      query: (query: string) => {
        return new Promise((resolve) => {
          mysqlConnection.query(query, (err, result: string[]) => {
            resolve(new DatabaseActionResult(err, result));
          });
        });
      },
    };
  }

  // Ensures that the frogtown database exists.
  public async ensureDatabaseExists(config: Config): Promise<boolean> {
    // Setup database-less connection
    const connection = await this.getRawDatabaseConnection(config);

    // Check for existing database
    let cmd = `
      SELECT SCHEMA_NAME
        FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME = 'frogtown';
    `;
    cmd = "pragma table_info(table_name);";
    let result = await connection.query(cmd);
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
    result = await connection.query(cmd);
    if (result.err) {
      logCritical("Error creating frogtown database.");
      return false;
    }

    logInfo("Created frogtown database.");
    return true;
  }

  // Retrieves a database connection from the connection pool.
  public getConnection(): Promise<DatabaseConnection | null> {
    // Default timeout 10 seconds
    return this.getConnectionTimeout(10000);
  }

  public getCreateTableSuffix(): string {
    return "ENGINE=InnoDB";
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

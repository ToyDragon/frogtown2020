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

export interface CardImageRow {
  card_id: string;
  update_time: string;
  quality: number;
}

export interface DeckKeyRow {
  id: string;
  owner_id: string;
  name: string;
}

export interface DeckCardRow {
  deck_id: string;
  card_id: string;
  board: number;
  count: number;
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
        back_url VARCHAR(100) NOT NULL,
        PRIMARY KEY(private_id),
        INDEX (private_id),
        INDEX (public_id)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    let result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      connection.release();
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
      connection.release();
      return;
    }

    // deck_keys table
    cmd = `
      CREATE TABLE IF NOT EXISTS deck_keys(
        id VARCHAR(24) NOT NULL,
        owner_id VARCHAR(24) NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY (id),
        INDEX (owner_id)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      connection.release();
      return;
    }

    // deck_cards table
    cmd = `
      CREATE TABLE IF NOT EXISTS deck_cards(
        deck_id VARCHAR(24) NOT NULL,
        card_id VARCHAR(36) NOT NULL,
        board SMALLINT NOT NULL,
        count SMALLINT NOT NULL,
        PRIMARY KEY (deck_id, card_id, board)
      ) ENGINE=InnoDB;
    `;

    // Perform creation and check for errors.
    result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      connection.release();
      return;
    }

    // card_images table
    cmd = `
      CREATE TABLE IF NOT EXISTS card_images(
        card_id VARCHAR(36) NOT NULL,
        update_time DATETIME NOT NULL,
        quality TINYINT NOT NULL,
        PRIMARY KEY (card_id),
        INDEX (quality)
      ) ENGINE=InnoDB;
    `;
    //Quality-
    //  0- No image
    //  1- LQ
    //  2- HQ

    // Perform creation and check for errors.
    result = await connection.query(cmd, []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      connection.release();
      return;
    }

    logInfo("Ensured tables exist.");
    connection.release();
  }

  // Retrieves a database connection from the connection pool.
  public getConnection(): Promise<DatabaseConnection | null> {
    const debugStack = new Error().stack!;
    return new Promise<DatabaseConnection | null>((resolve) => {
      this.connectionPool.getConnection((err, rawConnection) => {
        if (err) {
          logError(err);
          resolve(null);
        } else {
          resolve(new DatabaseConnection(debugStack, rawConnection));
        }
      });
    });
  }
}

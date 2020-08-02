import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";
import { logCritical, logInfo, logError } from "../log";

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

  private ensureDatabaseExists(config: Config): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const pw = fs.readFileSync(config.database.passwordFile).toString();
      const connectionOptions = {
        connectionLimit: 50,
        host: config.database.host,
        user: config.database.user,
        password: pw,
        database: "",
      };
      const connection = mysql.createConnection(connectionOptions);
      let cmd = `
        SELECT SCHEMA_NAME
          FROM INFORMATION_SCHEMA.SCHEMATA
        WHERE SCHEMA_NAME = 'frogtown'
      `;
      connection.query(cmd, (err, result: string[]) => {
        if (err) {
          logCritical("Error checking for database.");
          resolve(false);
        } else {
          if (result.length > 0) {
            logInfo("Database frogtown already exists.");
            resolve(true);
          } else {
            cmd = `
              CREATE DATABASE IF NOT EXISTS frogtown;
            `;
            connection.query(cmd, (err, createResult: string[]) => {
              if (err) {
                logCritical("Error creating frogtown database.");
                resolve(false);
              } else {
                logInfo("Created frogtown database.");
                logInfo(JSON.stringify(createResult));
                resolve(true);
              }
            });
          }
        }
      });
    });
  }

  public async ensureTablesExist(config: Config): Promise<void> {
    if (!(await this.ensureDatabaseExists(config))){
      return;
    }
    const connection = await this.getConnection();
    if (!connection) {
      logCritical("Unable to ensure required database tables exist.");
    } else {
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

      const result = await connection.query(cmd, []);
      if (result.err) {
        logCritical("Error while ensuring required database tables exist.");
        logCritical(result.err);
      } else {
        logInfo("Ensured tables exist.");
      }
    }
  }

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

import * as mysql from "mysql";
import * as fs from "fs";

import Config from "../config";
import { DatabaseConnection } from "./db_connection";

export default class DatabaseManager {
  private connectionPool: mysql.Pool;

  public constructor(config: Config) {
    const pw = fs.readFileSync(config.database.passwordFile).toString();

    this.connectionPool = mysql.createPool({
      connectionLimit: 50,
      host: config.database.host,
      user: config.database.user,
      password: pw,
    });
  }

  public getConnection(): Promise<DatabaseConnection | null> {
    return new Promise<DatabaseConnection | null>((resolve) => {
      this.connectionPool.getConnection((err, rawConnection) => {
        if (err) {
          resolve(null);
        } else {
          resolve(new DatabaseConnection(rawConnection));
        }
      });
    });
  }
}

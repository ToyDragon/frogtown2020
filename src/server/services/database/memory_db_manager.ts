import * as sqlite3 from "sqlite3";

import Config from "../config/config";
import { DatabaseConnection } from "./db_connection";
import DatabaseManager, { RawDatabaseConnection } from "./db_manager";
import { DatabaseActionResult } from "./db_action_result";
import { MysqlError } from "mysql";

export default class MemoryDatabaseManager implements DatabaseManager {
  private db!: sqlite3.Database;
  public constructor() {
    this.db = new sqlite3.Database(":memory:");
  }

  private getConn(): RawDatabaseConnection {
    return {
      query: (query: string) => {
        return new Promise((resolve) => {
          this.db.all(query, (err, result) => {
            resolve(new DatabaseActionResult(err, result));
          });
        });
      },
    };
  }

  public async getRawDatabaseConnection(
    _config: Config
  ): Promise<RawDatabaseConnection> {
    return this.getConn();
  }

  // Retrieves a database connection from the connection pool.
  public getConnection(): Promise<DatabaseConnection | null> {
    // Default timeout 10 seconds
    return this.getConnectionTimeout(10000);
  }

  public async ensureDatabaseExists(_config: Config): Promise<boolean> {
    return true;
  }

  public getCreateTableSuffix(): string {
    return "WITHOUT ROWID";
  }

  public async getConnectionTimeout(
    timeoutMillis: number
  ): Promise<DatabaseConnection | null> {
    const debugStack = new Error().stack!;
    const conn = this.getConn();
    return new DatabaseConnection(timeoutMillis, debugStack, {
      beginTransaction: (cb: (e: Error | null) => void) => {
        conn.query("START TRANSACTION;").then(() => cb(null));
      },
      commit: (cb: (e: Error | null) => void) => {
        conn.query("COMMIT;").then(() => cb(null));
      },
      rollback: (cb: (e: Error | null) => void) => {
        conn.query("ROLLBACK;").then(() => cb(null));
      },
      query: <T>(
        query: string,
        values: unknown[],
        cb: (err: Error | null, results: T | undefined) => void
      ) => {
        this.db.all(query, values, (err, result) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cb(err, result as any);
        });
      },
      release: () => {},
      on: (_ev: string, _callback: (err?: MysqlError) => void) => {},
    });
  }
}

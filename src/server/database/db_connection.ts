import { logError } from "../log";
import { DatabaseActionResult } from "./db_action_result";
import PooledConnection from "./db_poolconnection";

export class DatabaseConnection {
  private rawConnection: PooledConnection;
  private connectionOpen: boolean;
  private transactionOpen: boolean;

  public constructor(rawConnection: PooledConnection) {
    this.rawConnection = rawConnection;
    this.transactionOpen = false;
    this.connectionOpen = true;

    this.rawConnection.on("error", (err) => {
      logError("SQL Error: " + err);
    });
  }

  public beginTransaction(): Promise<DatabaseActionResult<void>> {
    return new Promise((resolve) => {
      if (this.transactionOpen) {
        const msg = "Tried to open a transaction when one was already open.";
        logError(msg);
        resolve(new DatabaseActionResult<void>(new Error(msg), null));
      } else if (!this.connectionOpen) {
        const msg =
          "Tried to open a transaction when the connection wasn't open.";
        logError(msg);
        resolve(new DatabaseActionResult<void>(new Error(msg), null));
      } else {
        this.rawConnection.beginTransaction((err) => {
          if (!err) {
            this.transactionOpen = true;
          }
          resolve(new DatabaseActionResult<void>(err, null));
        });
      }
    });
  }

  public query<T>(
    query: string,
    values: unknown[]
  ): Promise<DatabaseActionResult<T>> {
    return new Promise((resolve) => {
      if (!this.connectionOpen) {
        const msg = "Tried to query when the connection wasn't open.";
        logError(msg);
        resolve(new DatabaseActionResult<T>(new Error(msg), null));
      } else {
        this.rawConnection.query<T>(query, values, (err, results) => {
          if (typeof results === "undefined") {
            resolve(new DatabaseActionResult<T>(err, null));
          } else {
            resolve(new DatabaseActionResult<T>(err, results));
          }
        });
      }
    });
  }

  public commitOrRollback(): Promise<DatabaseActionResult<void>> {
    return new Promise((resolve) => {
      if (!this.transactionOpen) {
        const msg = "Tried to close a transaction that wasn't open.";
        logError(msg);
        resolve(new DatabaseActionResult<void>(new Error(msg), null));
      } else if (!this.connectionOpen) {
        const msg =
          "Tried to commit a transaction whose connection wasn't open.";
        logError(msg);
      } else {
        this.rawConnection.commit((err) => {
          if (err) {
            this.rawConnection.rollback(() => {
              this.transactionOpen = false;
              resolve(new DatabaseActionResult<void>(err, null));
            });
          } else {
            this.transactionOpen = false;
            resolve(new DatabaseActionResult(null, null));
          }
        });
      }
    });
  }

  public async release(): Promise<DatabaseActionResult<void>> {
    this.connectionOpen = false;
    this.rawConnection.release();
    return new DatabaseActionResult<void>(null, null);
  }
}

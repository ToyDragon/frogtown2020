import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoServerStatus extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS server_status(
        name VARCHAR(64) NOT NULL,
        heartbeat DATETIME NOT NULL,
        version INTEGER NOT NULL,
        status INTEGER NOT NULL,
        target_status INTEGER NOT NULL,
        PRIMARY KEY(name)
      ) ${createTableSuffix};
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export enum ServerStatus {
  Waiting = 0,
  Shutdown = 1,
}

export interface ServerStatusRow {
  name: string;
  heartbeat: string;
  version: number;
  status: ServerStatus;
  target_status: ServerStatus;
}

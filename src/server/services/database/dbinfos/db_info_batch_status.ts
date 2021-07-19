import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoBatchStatus extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
    CREATE TABLE IF NOT EXISTS batch_status(
      name VARCHAR(36) NOT NULL,
      value VARCHAR(256) NOT NULL,
      PRIMARY KEY (name)
    ) ${createTableSuffix};
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export interface BatchStatusRow {
  name: string;
  value: string;
}

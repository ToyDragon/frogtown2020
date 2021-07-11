import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoMetadata extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS metadata(
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

export interface MetadataRow {
  key: string;
  value: string;
}

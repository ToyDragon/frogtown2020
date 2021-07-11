import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoUserQuality extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS user_quality(
        ip_address VARCHAR(64) NOT NULL,
        PRIMARY KEY(ip_address)
      ) ${createTableSuffix};
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export interface UserQualityRow {
  ip_address: string;
}

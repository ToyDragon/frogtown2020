import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoDataFiles extends DBInfo {
  public getCreateCommand(): string {
    return `
      CREATE TABLE IF NOT EXISTS data_files(
        name VARCHAR(64) NOT NULL,
        update_time DATETIME NOT NULL,
        change_time DATETIME NOT NULL,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB;
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export interface DataFilesRow {
  name: string;
  update_time: string;
  change_time: string;
}

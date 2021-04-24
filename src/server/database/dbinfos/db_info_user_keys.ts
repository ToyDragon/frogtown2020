import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoUserKeys extends DBInfo {
  public getCreateCommand(): string {
    return `
      CREATE TABLE IF NOT EXISTS user_keys(
        private_id VARCHAR(64) NOT NULL,
        public_id VARCHAR(24) NOT NULL,
        back_url VARCHAR(256) NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY(private_id),
        INDEX (private_id),
        INDEX (public_id)
      ) ENGINE=InnoDB;
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export interface UserKeysRow {
  private_id: string;
  public_id: string;
  back_url: string;
  name: string;
}

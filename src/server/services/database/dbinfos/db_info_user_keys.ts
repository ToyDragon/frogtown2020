import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoUserKeys extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS user_keys(
        private_id VARCHAR(64) NOT NULL,
        public_id VARCHAR(24) NOT NULL,
        back_url VARCHAR(256) NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY(private_id)
      ) ${createTableSuffix};
      CREATE INDEX IF NOT EXISTS idx_private_id ON user_keys(private_id);
      CREATE INDEX IF NOT EXISTS idx_public_id ON user_keys(public_id);
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

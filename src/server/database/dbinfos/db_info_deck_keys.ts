import { DBInfo } from "./db_info";

export class DBInfoDeckKeys extends DBInfo {
  public getCreateCommand(): string {
    return `
      CREATE TABLE IF NOT EXISTS deck_keys(
        id VARCHAR(24) NOT NULL,
        owner_id VARCHAR(24) NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY (id),
        INDEX (owner_id)
      ) ENGINE=InnoDB;
    `;
  }
}

export interface DeckKeysRow {
  id: string;
  owner_id: string;
  name: string;
}

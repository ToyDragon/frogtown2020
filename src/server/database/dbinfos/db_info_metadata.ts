import { DBInfo } from "./db_info";

export class DBInfoMetadata extends DBInfo {
  public getCreateCommand(): string {
    return `
      CREATE TABLE IF NOT EXISTS metadata(
        name VARCHAR(36) NOT NULL,
        value VARCHAR(256) NOT NULL,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB;
    `;
  }
}

export interface MetadataRow {
  key: string;
  value: string;
}

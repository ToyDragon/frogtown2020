import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoCardImages extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
    CREATE TABLE IF NOT EXISTS card_images(
      card_id VARCHAR(36) NOT NULL,
      update_time DATETIME NOT NULL,
      quality TINYINT NOT NULL,
      PRIMARY KEY (card_id)
    ) ${createTableSuffix};
    CREATE INDEX IF NOT EXISTS idx_quality ON card_images(quality);
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

//Quality-
//  0- No image
//  1- LQ
//  2- HQ
export interface CardImagesRow {
  card_id: string;
  update_time: string;
  quality: number;
}

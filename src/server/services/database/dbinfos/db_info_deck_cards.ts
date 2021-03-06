import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoDeckCards extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS deck_cards(
        deck_id VARCHAR(24) NOT NULL,
        card_id VARCHAR(36) NOT NULL,
        board SMALLINT NOT NULL,
        count SMALLINT NOT NULL,
        PRIMARY KEY (deck_id, card_id, board)
      ) ${createTableSuffix};
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [];
  }
}

export interface DeckCardsRow {
  deck_id: string;
  card_id: string;
  board: number;
  count: number;
}

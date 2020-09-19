import { DBInfo } from "./db_info";

export class DBInfoDeckCards extends DBInfo {
  public getCreateCommand(): string {
    return `
      CREATE TABLE IF NOT EXISTS deck_cards(
        deck_id VARCHAR(24) NOT NULL,
        card_id VARCHAR(36) NOT NULL,
        board SMALLINT NOT NULL,
        count SMALLINT NOT NULL,
        PRIMARY KEY (deck_id, card_id, board)
      ) ENGINE=InnoDB;
    `;
  }
}

export interface DeckCardsRow {
  deck_id: string;
  card_id: string;
  board: number;
  count: number;
}

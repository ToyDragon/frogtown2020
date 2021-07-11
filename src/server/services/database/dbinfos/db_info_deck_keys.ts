import { logError, logInfo } from "../../../log";
import { DatabaseConnection } from "../db_connection";
import { DBInfo } from "./db_info";

export class DBInfoDeckKeys extends DBInfo {
  public getCreateCommand(createTableSuffix: string): string {
    return `
      CREATE TABLE IF NOT EXISTS deck_keys(
        id VARCHAR(24) NOT NULL,
        owner_id VARCHAR(24) NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY (id)
      ) ${createTableSuffix};
      CREATE INDEX IF NOT EXISTS idx_owner_id ON deck_keys(owner_id);
    `;
  }

  public getUpdateCommands(): ((
    connection: DatabaseConnection
  ) => Promise<boolean>)[] {
    return [
      async (connection: DatabaseConnection) => {
        const column_result = await connection.query<unknown[]>(
          "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=? and COLUMN_NAME=?;",
          ["deck_keys", "star_card_id"]
        );
        if (column_result.value?.length === 0) {
          const new_column_result = await connection.query<unknown[]>(
            "ALTER TABLE deck_keys ADD COLUMN star_card_id VARCHAR(36) NOT NULL;",
            []
          );
          if (new_column_result.err) {
            logError(
              "Unexpected error adding star_card_id to deck_keys table."
            );
            logError(new_column_result.err.name);
            logError(new_column_result.err.message);
            return false;
          } else {
            logInfo("Added star_card_id column to deck_ids");
          }
        }
        return true;
      },
      async (connection: DatabaseConnection) => {
        const column_result = await connection.query<unknown[]>(
          "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=? and COLUMN_NAME=?;",
          ["deck_keys", "card_count"]
        );
        if (column_result.value?.length === 0) {
          const new_column_result = await connection.query<unknown[]>(
            "ALTER TABLE deck_keys ADD COLUMN card_count SMALLINT NOT NULL;" +
              "ALTER TABLE deck_keys ADD COLUMN colors VARCHAR(12) NOT NULL;",
            []
          );
          if (new_column_result.err) {
            logError(
              "Unexpected error adding card_count and colors to deck_keys table."
            );
            logError(new_column_result.err.name);
            logError(new_column_result.err.message);
            return false;
          } else {
            logInfo("Added card_count and colors columns to deck_ids");
          }
        }
        return true;
      },
    ];
  }
}

export function ColorArrayToString(colorArr: string[]): string {
  let result = "";
  for (let i = 0; i < colorArr.length; ++i) {
    if (colorArr[i].toLocaleLowerCase() === "white") {
      result += "W";
    }
    if (colorArr[i].toLocaleLowerCase() === "blue") {
      result += "U";
    }
    if (colorArr[i].toLocaleLowerCase() === "black") {
      result += "B";
    }
    if (colorArr[i].toLocaleLowerCase() === "red") {
      result += "R";
    }
    if (colorArr[i].toLocaleLowerCase() === "green") {
      result += "G";
    }
  }
  return result;
}

export function ColorStringToArray(colorString: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < colorString.length; ++i) {
    colorString[i] === "W" && result.push("white");
    colorString[i] === "U" && result.push("blue");
    colorString[i] === "B" && result.push("black");
    colorString[i] === "R" && result.push("red");
    colorString[i] === "G" && result.push("green");
  }
  return result;
}

export interface DeckKeysRow {
  id: string;
  owner_id: string;
  name: string;
  star_card_id: string;
  colors: string;
  card_count: number;
}

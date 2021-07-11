import * as express from "express";
import Services from "../../server/services";
import { IncludedData } from "../../server/view_data";
import { Deck } from "../shared/deck_types";
import { logInfo, logError } from "../../server/log";
import { addEndpointWithParams, UserDetails } from "../../shared/utils";
import {
  DeckViewerSaveDeck,
  DeckViewerChangeMetadata,
  DeckViewerDelete,
} from "./types";
import {
  ColorStringToArray,
  DeckKeysRow,
} from "../../server/services/database/dbinfos/db_info_deck_keys";
import { DeckCardsRow } from "../../server/services/database/dbinfos/db_info_deck_cards";
import { DatabaseConnection } from "../../server/services/database/db_connection";

// Router that handles page specific request.
export default function handler(services: Services): express.Router {
  const router = express.Router();

  addEndpointWithParams<DeckViewerChangeMetadata, boolean>(
    router,
    "/updateMetadata",
    async (user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return false;
      }

      await SetDeckMetadata(user, params, connection);

      connection.release();
      return true;
    }
  );

  addEndpointWithParams<DeckViewerDelete, boolean>(
    router,
    "/deleteDeck",
    async (user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return false;
      }

      // Verify that this user is the owner of this deck.
      const deckRows = await connection.query<DeckKeysRow[]>(
        "SELECT * FROM deck_keys WHERE id=? AND owner_id=?;",
        [params.deckId, user.publicId]
      );
      if (!deckRows?.value || deckRows.value.length === 0) {
        logError("User tried to modify deck name they don't own.");
        connection.release();
        return false;
      }

      await connection.query<void>("DELETE FROM deck_keys WHERE id=?;", [
        params.deckId,
      ]);
      await connection.query<void>("DELETE FROM deck_cards WHERE deck_id=?;", [
        params.deckId,
      ]);

      connection.release();
      return true;
    }
  );

  addEndpointWithParams<DeckViewerSaveDeck, string>(
    router,
    "/updateCards",
    async (user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return "";
      }

      await UpdateDeckCards(user, params, connection);
      connection.release();
      return "saved";
    }
  );

  return router;
}

export async function SetDeckMetadata(
  user: UserDetails,
  params: DeckViewerChangeMetadata,
  connection: DatabaseConnection
): Promise<boolean> {
  // Verify that this user is the owner of this deck.
  const deckRows = await connection.query<DeckKeysRow[]>(
    "SELECT * FROM deck_keys WHERE id=? AND owner_id=?;",
    [params.deckId, user.publicId]
  );
  if (!deckRows?.value || deckRows.value.length === 0) {
    logError("User tried to modify deck name they don't own.");
    return false;
  }

  if (params.name) {
    await connection.query<DeckKeysRow[]>(
      "UPDATE deck_keys SET name=? WHERE id=?;",
      [params.name, params.deckId]
    );
  }
  if (params.keyCard) {
    await connection.query<DeckKeysRow[]>(
      "UPDATE deck_keys SET star_card_id=? WHERE id=?;",
      [params.keyCard, params.deckId]
    );
  }
  return true;
}

export async function UpdateDeckCards(
  user: UserDetails,
  params: DeckViewerSaveDeck,
  connection: DatabaseConnection
): Promise<void> {
  // Verify that this user is the owner of this deck.
  const deckRows = await connection.query<DeckKeysRow[]>(
    "SELECT * FROM deck_keys WHERE id=? AND owner_id=?;",
    [params.deckId, user.publicId]
  );
  if (!deckRows?.value || deckRows.value.length === 0) {
    logError("User tried to modify deck they don't own.");
    return;
  }

  // Update metadata.
  const colorMap: Record<string, string> = {
    white: "W",
    blue: "U",
    black: "B",
    red: "R",
    green: "G",
  };
  const colorString = params.colors
    .map((a) => {
      return colorMap[a] || "";
    })
    .join("");
  const meta_result = await connection.query<DeckKeysRow[]>(
    "UPDATE deck_keys SET card_count=?,colors=? WHERE id=?;",
    [params.cardCount, colorString, params.deckId]
  );
  if (meta_result.err) {
    logError(meta_result.err.name);
    logError(meta_result.err.message);
  }

  const cards: {
    mainboard: Record<string, { previous: number; new: number }>;
    sideboard: Record<string, { previous: number; new: number }>;
  } = { mainboard: {}, sideboard: {} };

  // Get all existing cards in deck, so if some are removed we can delete their rows.
  const existingCardRows = await connection.query<DeckCardsRow[]>(
    "SELECT * FROM deck_cards WHERE deck_id=?;",
    [params.deckId]
  );
  if (existingCardRows?.value) {
    for (const row of existingCardRows.value) {
      if (row.board === 0) {
        cards.mainboard[row.card_id] = {
          previous: row.count,
          new: 0,
        };
      } else {
        cards.sideboard[row.card_id] = {
          previous: row.count,
          new: 0,
        };
      }
    }
  }

  // Add changes from client into card list object.
  if (params.mainboard && params.mainboard.length) {
    for (const cardId of params.mainboard) {
      cards.mainboard[cardId] = cards.mainboard[cardId] || {
        previous: 0,
        new: 0,
      };
      cards.mainboard[cardId].new++;
    }
  }
  if (params.sideboard && params.sideboard.length) {
    for (const cardId of params.sideboard) {
      cards.sideboard[cardId] = cards.sideboard[cardId] || {
        previous: 0,
        new: 0,
      };
      cards.sideboard[cardId].new++;
    }
  }

  // Tell database about any changes that were made.
  let command = "";
  const args: unknown[] = [];
  for (const cardId in cards.mainboard) {
    if (cards.mainboard[cardId].new !== cards.mainboard[cardId].previous) {
      if (cards.mainboard[cardId].new === 0) {
        command += command.length ? "\n" : "";
        command +=
          "DELETE FROM deck_cards WHERE deck_id=? AND card_id=? AND board=?;";
        args.push(params.deckId);
        args.push(cardId);
        args.push(0);
      } else {
        command += command.length ? "\n" : "";
        command +=
          "REPLACE INTO deck_cards (deck_id, card_id, board, count) VALUES (?, ?, ?, ?);";
        args.push(params.deckId);
        args.push(cardId);
        args.push(0);
        args.push(cards.mainboard[cardId].new);
      }
    }
  }
  for (const cardId in cards.sideboard) {
    if (cards.sideboard[cardId].new !== cards.sideboard[cardId].previous) {
      if (cards.sideboard[cardId].new === 0) {
        command += command.length ? "\n" : "";
        command +=
          "DELETE FROM deck_cards WHERE deck_id=? AND card_id=? AND board=?;";
        args.push(params.deckId);
        args.push(cardId);
        args.push(1);
      } else {
        command += command.length ? "\n" : "";
        command +=
          "REPLACE INTO deck_cards (deck_id, card_id, board, count) VALUES (?, ?, ?, ?);";
        args.push(params.deckId);
        args.push(cardId);
        args.push(1);
        args.push(cards.sideboard[cardId].new);
      }
    }
  }

  const result = await connection.query<void>(command, args);
  if (result.err) {
    logInfo("Err: " + JSON.stringify(result.err));
  }
}

export const DeckViewerIncludedData: IncludedData[] = [
  {
    var: "deckDetails",
    retriever: async (
      services: Services,
      req: express.Request
    ): Promise<Deck | null> => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return null;
      }

      // Load deck details
      const deckId = req.params["deckId"] || "";
      const deckRows = await connection.query<DeckKeysRow[]>(
        "SELECT * FROM deck_keys WHERE id=?;",
        [deckId]
      );
      if (!deckRows || !deckRows.value || deckRows.value.length === 0) {
        connection.release();
        logInfo("Failed loading from deck_keys.");
        return null;
      }

      // Load cards in deck
      const mainboard: string[] = [];
      const sideboard: string[] = [];
      const cardRows = await connection.query<DeckCardsRow[]>(
        "SELECT * FROM deck_cards WHERE deck_id=?;",
        [deckId]
      );
      if (cardRows?.value && cardRows.value.length > 0) {
        for (const cardRow of cardRows.value) {
          for (let i = 0; i < cardRow.count; i++) {
            if (cardRow.board === 0) {
              mainboard.push(cardRow.card_id);
            } else {
              sideboard.push(cardRow.card_id);
            }
          }
        }
      }

      // Load owner details
      const userRows = await connection.query<
        { name: string; back_url: string }[]
      >("SELECT * FROM user_keys WHERE public_id=?;", [
        deckRows.value[0].owner_id,
      ]);
      if (!userRows?.value || userRows.value.length !== 1) {
        connection.release();
        logInfo("Failed loading from userRows.");
        logInfo(JSON.stringify(userRows?.value));
        logInfo(JSON.stringify(deckRows.value[0].owner_id));
        return null;
      }

      connection.release();
      return {
        id: deckRows.value[0].id,
        ownerId: deckRows.value[0].owner_id,
        ownerName: userRows.value[0].name,
        ownerBackURL: userRows.value[0].back_url,
        mainboard: mainboard,
        sideboard: sideboard,
        name: deckRows.value[0].name,
        keyCard: deckRows.value[0].star_card_id,
        colors: ColorStringToArray(deckRows.value[0].colors),
        cardCount: deckRows.value[0].card_count,
      };
    },
  },
];

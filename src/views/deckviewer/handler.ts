import * as express from "express";
import Services from "../../server/services";
import { IncludedData } from "../../server/view_data";
import { Deck } from "../shared/deck_types";
import { DeckKeyRow, DeckCardRow } from "../../server/database/db_manager";
import { logInfo, logError } from "../../server/log";
import { addEndpointWithParams } from "../../shared/utils";
import { DeckViewerSaveDeck, DeckViewerChangeName } from "./types";

// Router that handles page specific request.
export default function handler(services: Services): express.Router {
  const router = express.Router();

  addEndpointWithParams<DeckViewerChangeName, boolean>(
    router,
    "/updateName",
    async (user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return false;
      }

      // Verify that this user is the owner of this deck.
      const deckRows = await connection.query<DeckKeyRow[]>(
        "SELECT * FROM deck_keys WHERE id=? AND owner_id=?;",
        [params.deckId, user.publicId]
      );
      if (!deckRows?.value || deckRows.value.length === 0) {
        logError("User tried to modify deck name they don't own.");
        connection.release();
        return false;
      }

      await connection.query<DeckKeyRow[]>(
        "UPDATE deck_keys SET name=? WHERE id=?;",
        [params.name, params.deckId]
      );

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

      // Verify that this user is the owner of this deck.
      const deckRows = await connection.query<DeckKeyRow[]>(
        "SELECT * FROM deck_keys WHERE id=? AND owner_id=?;",
        [params.deckId, user.publicId]
      );
      if (!deckRows?.value || deckRows.value.length === 0) {
        logError("User tried to modify deck they don't own.");
        connection.release();
        return "";
      }

      const cards: {
        mainboard: Record<string, { previous: number; new: number }>;
        sideboard: Record<string, { previous: number; new: number }>;
      } = { mainboard: {}, sideboard: {} };

      // Get all existing cards in deck, so if some are removed we can delete their rows.
      const existingCardRows = await connection.query<DeckCardRow[]>(
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
      for (const cardId in cards.mainboard) {
        if (cards.mainboard[cardId].new !== cards.mainboard[cardId].previous) {
          if (cards.mainboard[cardId].new === 0) {
            await connection.query<void>(
              "DELETE FROM deck_cards WHERE deck_id=? AND card_id=? AND board=?;",
              [params.deckId, cardId, 0]
            );
          } else {
            await connection.query<void>(
              "REPLACE INTO deck_cards (deck_id, card_id, board, count) VALUES (?, ?, ?, ?);",
              [params.deckId, cardId, 0, cards.mainboard[cardId].new]
            );
          }
        }
      }
      for (const cardId in cards.sideboard) {
        if (cards.sideboard[cardId].new !== cards.sideboard[cardId].previous) {
          if (cards.sideboard[cardId].new === 0) {
            await connection.query<void>(
              "DELETE FROM deck_cards WHERE deck_id=? AND card_id=? AND board=?;",
              [params.deckId, cardId, 1]
            );
          } else {
            await connection.query<void>(
              "REPLACE INTO deck_cards (deck_id, card_id, board, count) VALUES (?, ?, ?, ?);",
              [params.deckId, cardId, 1, cards.sideboard[cardId].new]
            );
          }
        }
      }

      connection.release();
      return "saved";
    }
  );

  return router;
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
      const deckRows = await connection.query<DeckKeyRow[]>(
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
      const cardRows = await connection.query<DeckCardRow[]>(
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
      };
    },
  },
];

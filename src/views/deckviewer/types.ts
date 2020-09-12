import { Deck } from "../shared/deck_types";

export interface DeckViewerIncludedData {
  deckDetails: Deck;
}

export interface DeckViewerSaveDeck {
  deckId: string;
  mainboard: string[];
  sideboard: string[];
}

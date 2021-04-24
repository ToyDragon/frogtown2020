import { Deck } from "../shared/deck_types";

export interface DeckViewerIncludedData {
  deckDetails: Deck;
}

export interface DeckViewerSaveDeck {
  deckId: string;
  mainboard: string[];
  sideboard: string[];
  cardCount: number;
  colors: string[];
}

export interface DeckViewerChangeMetadata {
  deckId: string;
  name: string | null;
  keyCard: string | null;
}

export interface DeckViewerDelete {
  deckId: string;
}

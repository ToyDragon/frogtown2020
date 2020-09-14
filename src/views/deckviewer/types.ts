import { Deck } from "../shared/deck_types";

export interface DeckViewerIncludedData {
  deckDetails: Deck;
}

export interface DeckViewerSaveDeck {
  deckId: string;
  mainboard: string[];
  sideboard: string[];
}

export interface DeckViewerChangeName {
  deckId: string;
  name: string;
}

export interface DeckViewerDelete {
  deckId: string;
}

import { MapData } from "./data_map_types";

export interface Deck {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerBackURL?: string;
  mainboard: string[];
  sideboard: string[];
  name: string;
  ttsLink?: string;
  subsets?: MapData;
}

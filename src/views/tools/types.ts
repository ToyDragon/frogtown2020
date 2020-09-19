export interface DataInfoResponse {
  allCardsUpdateDate: string | null;
  allCardsChangeDate: string | null;
  allCardsNextChangeDate: string;
  dataMapsUpdateDate: string | null;
  dataMapsChangeDate: string | null;
  allCardsS3Date: string | null;
  allCardsUpdateInProgress: boolean;
  dataMapsUpdateInProgress: boolean;
}

export interface ProgressResponse {
  progress: number;
}

export interface OptionalProgressResponse {
  progress: number | null;
}

export enum ImageInfo {
  // Missing means there is no row in card_images table for this ID. For most purposes, this value should be treated identically to NONE.
  MISSING = 1,

  NONE = 2,
  LQ = 3,
  HQ = 4,
}

export interface CardImageUpdateProgressResponse {
  max: number;
  position: number;
}

export interface CardImageUpdateStartRequest {
  allMissingCards: boolean;
  cardIds: string[];
}

export interface CardImageInfoResponse {
  lastUpdateDate: string;
  imageTypeByID: Record<string, ImageInfo>;
  countByType: { [type: number]: number };
  cardsNotHQWithHQAvailable: string[];
  cardsMissingWithLQAvailable: string[];
}

export interface DataInfoResponse {
  allCardsUpdateDate: string | null;
  allCardsChangeDate: string | null;
  allCardsNextChangeDate: string;
  dataMapsUpdateDate: string | null;
  dataMapsChangeDate: string | null;
  allCardsUpdateInProgress: boolean;
  dataMapsUpdateInProgress: boolean;
}

export interface ProgressResponse {
  progress: number;
}

export interface OptionalProgressResponse {
  progress: number | null;
}

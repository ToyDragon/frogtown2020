export interface DataInfoResponse {
  allCardsUpdateDate: string | null;
  allCardsChangeDate: string | null;
  allCardsNextChangeDate: string;
  dataMapsUpdateDate: string | null;
  allCardsUpdateInProgress: boolean;
}

export interface ProgressResponse {
  progress: number;
}

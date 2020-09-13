export interface NewUserResponse {
  privateId: string;
  publicId: string;
}

export interface DataDetailsResponse {
  baseURL: string;
  changeDate: string;
  awsS3HighQualityImageBucket: string;
  awsS3CompressedImageBucket: string;
  awsS3DataMapBucket: string;
  imageVersion: number;
}

export interface ToolbarNewDeckResponse {
  deckId: string;
}

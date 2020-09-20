export interface NewUserResponse {
  privateId: string;
  publicId: string;
}

export interface ImageVersionDetails {
  version: number;
  change: string;
}

export interface DataDetailsResponse {
  baseURL: string;
  changeDate: string;
  awsS3HighQualityImageBucket: string;
  awsS3CompressedImageBucket: string;
  awsS3DataMapBucket: string;
  imageVersion: ImageVersionDetails;
}

export interface ToolbarNewDeckResponse {
  deckId: string;
}

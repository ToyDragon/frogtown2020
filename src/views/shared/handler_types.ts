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
  awsS3SetSVGBucket: string;
  imageVersion: ImageVersionDetails;
}

export interface ToolbarNewDeckResponse {
  deckId: string;
}

export interface UserDetailsRequest {
  publicId: string;
}

export interface UserDetailsResponse {
  backURL: string;
  name: string;
}

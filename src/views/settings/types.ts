export interface NameChangeRequest {
  newName: string;
}

export interface TTSBackChangeRequest {
  newURL: string;
}

export interface UserQualityResponse {
  isHQ: boolean;
}

export interface QualityChangeRequest {
  isHQ: boolean;
}

export interface ValidatePrivateIDRequest {
  id: string;
}

export interface ValidatePrivateIDResponse {
  publicId: string | null;
}

export interface Server {
  name: string;
  heartbeat: number;
  version: number;
  status: string;
  targetStatus: string;
}

export interface ServerStatusResponse {
  batch_server: string;
  servers: Server[];
}

export interface SetServerTargetStatusRequest {
  name: string;
  targetStatus: number;
}

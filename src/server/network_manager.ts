import * as https from "https";
import * as stream from "stream";

export interface GetResult {
  stream: stream.Stream;
  stop: () => void;
}

export default interface NetworkManager {
  httpsGet(options: string | https.RequestOptions | URL): Promise<GetResult>;
}

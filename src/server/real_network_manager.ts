import * as https from "https";
import NetworkManager, { GetResult } from "./network_manager";

export default class RealNetworkManager implements NetworkManager {
  httpsGet(options: string | https.RequestOptions | URL): Promise<GetResult> {
    return new Promise((resolve) => {
      const request = https.get(options, (res) => {
        resolve({
          stream: res,
          stop: () => {
            request.end();
          },
        });
      });
    });
  }
}

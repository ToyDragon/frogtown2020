import * as https from "https";
import dumpStream from "./dump_stream";
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

  public async httpsGetJson<K>(
    options: string | https.RequestOptions | URL
  ): Promise<K | null> {
    try {
      const rawResult = await dumpStream((await this.httpsGet(options)).stream);
      return JSON.parse(rawResult) as K;
    } catch {
      return null;
    }
  }
}

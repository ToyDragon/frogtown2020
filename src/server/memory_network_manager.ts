import * as stream from "stream";
import * as https from "https";
import NetworkManager, { GetResult } from "./network_manager";
import { timeout } from "../shared/utils";

export default class MemoryNetworkManager implements NetworkManager {
  private data!: Record<string, string>;
  public constructor(data: Record<string, string>) {
    this.data = data;
  }

  public async httpsGet(
    options: string | https.RequestOptions | URL
  ): Promise<GetResult> {
    let url = "";
    if (typeof options === "string") {
      url = options;
    } else {
      throw new Error("Unimplemented.");
    }
    const s = new stream.Stream();
    (async () => {
      if (this.data[url]) {
        await timeout(100);
        s.emit("data", this.data[url]);
      } else {
        console.log("Unexpected network request: " + url);
      }
      await timeout(100);
      s.emit("end");
      s.emit("close");
    })();
    return {
      stream: s,
      stop: () => {},
    };
  }
}

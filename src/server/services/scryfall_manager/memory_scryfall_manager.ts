import * as stream from "stream";
import { timeout } from "../../../shared/utils";
import ScryfallManager from "./scryfall_manager";

export default class MemoryScryfallManager implements ScryfallManager {
  private data!: Record<string, string>;
  private streams!: Record<string, () => stream.Stream>;
  public constructor(
    data: Record<string, string>,
    streams: Record<string, () => stream.Stream>
  ) {
    this.data = data;
    this.streams = streams;
  }

  public async requestRaw(url: string): Promise<string | null> {
    if (typeof this.data[url] === "undefined") {
      return null;
    }
    return this.data[url];
  }

  public async request<T>(url: string): Promise<T | null> {
    if (typeof this.data[url] === "undefined") {
      return null;
    }
    try {
      return JSON.parse(this.data[url]) as T;
    } catch {
      return null;
    }
  }

  public async requestStream(url: string): Promise<stream.Stream> {
    if (this.streams[url]) {
      return this.streams[url]();
    }
    const s = new stream.Stream();
    (async () => {
      await timeout(50);
      s.emit("data", this.data[url]);
      s.emit("end");
      s.emit("close");
    })();
    return s;
  }
}

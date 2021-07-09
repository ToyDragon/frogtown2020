import * as stream from "stream";

export default class MemoryScryfallManager {
  private data!: Record<string, string>;
  public constructor(data: Record<string, string>) {
    this.data = data;
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

  public async requestStream(url: string): Promise<stream.Readable> {
    const s = new stream.Readable();
    s.push(this.data[url]);
    s.push(null);
    return s;
  }
}

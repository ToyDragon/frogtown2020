import LocalStorage, { FileStats } from "./local_storage";
import * as stream from "stream";

// Wrapper around fs functions.
export default class MemoryLocalStorage implements LocalStorage {
  private data: Record<string, string> = {};

  public tryUnlink(path: string): Promise<void> {
    return new Promise((resolve) => {
      delete this.data[path];
      resolve();
    });
  }

  public async createReadStream(
    path: string,
    _options?: { encoding: BufferEncoding }
  ): Promise<stream.Readable | null> {
    const s = new stream.Readable();
    s.push(this.data[path]);
    s.push(null);
    return s;
  }

  public stat(path: string): Promise<FileStats | null> {
    return new Promise((resolve) => {
      if (typeof this.data[path] === undefined) {
        return resolve(null);
      }
      resolve({});
    });
  }

  public readFile(
    path: string,
    _options?: { encoding: BufferEncoding }
  ): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof this.data[path] === undefined) {
        return resolve(null);
      }
      resolve(this.data[path]);
    });
  }
}

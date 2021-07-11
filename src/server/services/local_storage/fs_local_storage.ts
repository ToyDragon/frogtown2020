import LocalStorage, { FileStats } from "./local_storage";
import * as fs from "fs";
import * as stream from "stream";

// Wrapper around fs functions.
export default class FsLocalStorage implements LocalStorage {
  public tryUnlink(path: string): Promise<void> {
    return new Promise((resolve) => {
      fs.unlink(path, (_err) => {
        // Ignore error, just resolve regardless of if the file existed or not.
        resolve();
      });
    });
  }

  public async createReadStream(
    path: string,
    options?: { encoding: BufferEncoding }
  ): Promise<stream.Readable | null> {
    return fs.createReadStream(path, options || {});
  }

  public async createWriteStream(
    path: string,
    options?: { encoding: BufferEncoding }
  ): Promise<stream.Writable | null> {
    return fs.createWriteStream(path, options || {});
  }

  public stat(path: string): Promise<FileStats | null> {
    return new Promise((resolve) => {
      fs.stat(path, (err, _stats) => {
        if (err) {
          return resolve(null);
        }
        resolve({});
      });
    });
  }

  public readFile(
    path: string,
    options?: { encoding: BufferEncoding }
  ): Promise<string | null> {
    return new Promise((resolve) => {
      fs.readFile(path, options, (err, data) => {
        if (err) {
          return resolve(null);
        }
        resolve(data.toString());
      });
    });
  }
}

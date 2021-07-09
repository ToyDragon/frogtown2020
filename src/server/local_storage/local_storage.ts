import * as stream from "stream";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileStats {}

//
export default interface LocalStorage {
  tryUnlink(path: string): Promise<void>;
  createReadStream(path: string): Promise<stream.Readable | null>;
  createWriteStream(path: string): Promise<stream.Writable | null>;
  stat(path: string): Promise<FileStats | null>;
  readFile(path: string): Promise<string | null>;
}

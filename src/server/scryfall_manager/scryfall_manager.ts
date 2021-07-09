import * as stream from "stream";

export default interface ScryfallManager {
  requestRaw(url: string): Promise<string | null>;
  request<T>(url: string): Promise<T | null>;
  requestStream(url: string): Promise<stream.Readable>;
}

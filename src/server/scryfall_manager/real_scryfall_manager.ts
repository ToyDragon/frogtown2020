import * as stream from "stream";
import { logInfo } from "../log";
import { RateLimiter } from "../rate_limiter";
import { httpsGet, httpsGetMessage, httpsGetRaw } from "../../shared/utils";

let alreadyExists = false;

export default class RealScryfallManager {
  private rateLimiter!: RateLimiter;

  public constructor() {
    if (alreadyExists) {
      throw new Error("Only initialize one scryfall manager.");
    }
    alreadyExists = true;
    // Scryfall asks for 50-100ms delay, use 150 here to be safe.
    this.rateLimiter = new RateLimiter(150);
  }

  public async requestRaw(url: string): Promise<string | null> {
    await this.rateLimiter.lock();
    logInfo("Requesting scryfall url: " + url);
    const response = await httpsGetRaw(url);
    this.rateLimiter.unlock();
    return response;
  }

  public async request<T>(url: string): Promise<T | null> {
    await this.rateLimiter.lock();
    logInfo("Requesting scryfall url: " + url);
    const response = await httpsGet<T>(url);
    this.rateLimiter.unlock();
    return response;
  }

  public async requestStream(url: string): Promise<stream.Readable> {
    await this.rateLimiter.lock();
    logInfo("Requesting scryfall stream url: " + url);
    const response = await httpsGetMessage(url);
    response.on("end", () => {
      this.rateLimiter.unlock();
    });
    return response;
  }
}

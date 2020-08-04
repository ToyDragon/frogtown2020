import * as https from "https";
import { logInfo } from "./log";

let alreadyExists = false;

interface RequestDetails {
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: (value?: any) => void;
}

export default class ScryfallManager {
  private lastRequest: Date;
  private requestQueue: RequestDetails[];
  private requestInProgress: boolean;
  private paused: boolean;

  public constructor() {
    if (alreadyExists) {
      throw new Error("Only initialize one scryfall manager.");
    }
    alreadyExists = true;
    this.paused = false;
    this.lastRequest = new Date();
    this.requestQueue = [];
    this.requestInProgress = false;
  }

  public pause(): void {
    logInfo("Paused scryfall manager.");
    this.paused = true;
  }

  public unpause(): void {
    logInfo("Unpaused scryfall manager.");
    this.paused = false;
    this.tryProcessRequest();
  }

  private tryProcessRequest(): void {
    if (this.requestInProgress || this.requestQueue.length === 0) {
      logInfo("Done processing scryfall requests.");
      return;
    }

    if (this.paused) {
      logInfo("Waiting for unpause before contacting scryfall.");
    }

    const ellapsedTime = new Date().getTime() - this.lastRequest.getTime();
    if (ellapsedTime <= 150) {
      logInfo(
        "Waiting " + (150 - ellapsedTime) + " ms before contacting scryfall."
      );
      setTimeout(() => {
        this.tryProcessRequest();
      }, 150 - ellapsedTime);
      return;
    }

    const request = this.requestQueue.splice(0, 1)[0];
    logInfo("Requesting: " + request.url);
    this.lastRequest = new Date();
    https.get(request.url, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        let result: unknown = null;
        try {
          result = JSON.parse(data);
        } finally {
          request.resolver(result);
        }
      });
    });
  }

  public request<T>(url: string): Promise<T> {
    return new Promise((resolve) => {
      this.requestQueue.push({
        url: url,
        resolver: resolve,
      });
      this.tryProcessRequest();
    });
  }
}

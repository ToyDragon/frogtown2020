import * as https from "https";
import * as http from "http";
import { logInfo } from "./log";

// Scryfall asks for 50-100ms delay, use 150 here to be safe.
const targetDelay = 150;

let alreadyExists = false;

interface RequestDetails {
  url: string;
  stream: boolean;
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
    if (this.requestQueue.length === 0) {
      logInfo("Done processing scryfall requests.");
      return;
    }

    if (this.requestInProgress) {
      logInfo("Waiting for stream request to finish.");
      return;
    }

    if (this.paused) {
      logInfo("Waiting for unpause before contacting scryfall.");
    }

    const ellapsedTime = new Date().getTime() - this.lastRequest.getTime();
    if (ellapsedTime <= targetDelay) {
      logInfo(
        "Waiting " +
          (targetDelay - ellapsedTime) +
          " ms before contacting scryfall."
      );
      setTimeout(() => {
        this.tryProcessRequest();
      }, targetDelay - ellapsedTime);
      return;
    }

    const request = this.requestQueue.splice(0, 1)[0];
    logInfo("Requesting: " + request.url);
    if (request.stream) {
      this.requestInProgress = true;
      https.get(request.url, (response) => {
        if (response.statusCode === 301) {
          const newUrl = response.headers.location || "";
          logInfo("Redirect to " + newUrl);
          https.get(newUrl, (redirectedResponse) => {
            redirectedResponse.on("end", () => {
              this.requestInProgress = false;
              this.lastRequest = new Date();
            });
            request.resolver(redirectedResponse);
          });
        } else {
          response.on("end", () => {
            this.requestInProgress = false;
            this.lastRequest = new Date();
          });
          request.resolver(response);
        }
      });
    } else {
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
  }

  public request<T>(url: string): Promise<T> {
    return new Promise((resolve) => {
      this.requestQueue.push({
        url: url,
        stream: false,
        resolver: resolve,
      });
      this.tryProcessRequest();
    });
  }

  public requestStream(url: string): Promise<http.IncomingMessage> {
    return new Promise((resolve) => {
      this.requestQueue.push({
        url: url,
        stream: true,
        resolver: resolve,
      });
      this.tryProcessRequest();
    });
  }
}

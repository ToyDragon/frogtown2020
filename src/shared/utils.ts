import * as express from "express";
import { logInfo } from "../server/log";
import Config from "../server/config";
import * as https from "https";

/**
 * Any shared helper functions whose usefullness isn't restricted to a single area.
 */

/**
 * Generate a string containing random uppercase letters and numbers of the specified length.
 * @param {number} length
 */
export function randomString(length: number): string {
  const candidateChars = "abcdefghikjlmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; ++i) {
    result += candidateChars.charAt(candidateChars.length * Math.random());
  }
  return result;
}

/**
 * Helper that makes it easy to enforce response types.
 * @param {Services} router
 * @param {string} route
 */
export function addEndpoint<T>(
  router: express.Router,
  route: string,
  cb: () => Promise<T | null>
): void {
  router.post(route, async (_request, response) => {
    response.end(JSON.stringify(await cb()));
  });
}

/**
 * Helper that makes it easy to enforce response types.
 * @param {Services} router
 * @param {string} route
 */
export function addEndpointWithParams<R, T>(
  router: express.Router,
  route: string,
  cb: (params: R) => Promise<T | null>
): void {
  router.post(route, async (request, response) => {
    logInfo("Recieved body: " + JSON.stringify(request.body));
    response.end(JSON.stringify(await cb((request.body as unknown) as R)));
  });
}

/**
 * Returns a promise that resolves after a certain number of milliseconds
 * @param {number} duration
 */
export function wait(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

/**
 * Turns a date into the format expected by MySQL
 * @param {Date} date
 */
export function dateToMySQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function httpsGet<T>(path: string): Promise<T> {
  return new Promise((resolve) => {
    https.get(path, (msg) => {
      let data = "";
      msg.on("data", (chunk) => {
        data += chunk;
      });
      msg.on("close", () => {
        resolve(JSON.parse(data) as T);
      });
    });
  });
}

export async function getAllCardIDs(config: Config): Promise<string[]> {
  const result: string[] = [];
  const commonRoot =
    config.storage.externalRoot + "/" + config.storage.awsS3DataMapBucket + "/";
  const allImgMaps = [
    await httpsGet<Record<string, string>>(
      commonRoot + "IDToLargeImageURI.json"
    ),
    await httpsGet<Record<string, string>>(
      commonRoot + "BackIDToLargeImageURI.json"
    ),
    await httpsGet<Record<string, string>>(
      commonRoot + "TokenIDToLargeImageURI.json"
    ),
  ];
  for (const map of allImgMaps) {
    for (const id in map) {
      result.push(id);
    }
  }
  return result;
}

export function stringArrayToRecord(data: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const ele of data) {
    result[ele] = true;
  }
  return result;
}

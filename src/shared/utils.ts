import * as express from "express";
import { logInfo } from "../server/log";

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

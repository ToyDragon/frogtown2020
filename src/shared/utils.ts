import * as express from "express";

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
  cb: (request: express.Request) => Promise<T | null>
): void {
  router.get(route, async (request, response) => {
    response.end(JSON.stringify(await cb(request)));
  });
}
/**
 * Any shared helper functions whose usefullness isn't restricted to a single area.
 */

/**
 * Generate a string containing random uppercase letters and numbers of the specified length.
 * @param {number} length
 */
export function randomString(length: number): string {
  const candidateChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; ++i) {
    result += candidateChars[candidateChars.length * Math.random()];
  }
  return result;
}

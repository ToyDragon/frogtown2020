export enum Level {
  INFO = 3,
  WARNING = 2,
  ERROR = 1,
  CRITICAL = 0,
  NONE = -1,
}

let currentLogLevel = Level.INFO;

/**
 * Sets the maximum level of logs that will be displayed.
 * @param {number} level
 */
export function setLogLevel(level: number): void {
  currentLogLevel = level;
}

/**
 * Add output to the log with the given level
 * @param {number} level
 * @param {unknown[]} args
 */
export function log(level: number, ...args: unknown[]): void {
  if (level <= currentLogLevel) {
    console.log(...args);
  }
}

/**
 * Add output to the info log
 * @param {unknown[]} args
 */
export function logInfo(...args: unknown[]): void {
  log(Level.INFO, ...args);
}

/**
 * Add output to the info log
 * @param {unknown[]} args
 */
export function logWarning(...args: unknown[]): void {
  log(Level.WARNING, ...args);
}

/**
 * Add output to the info log
 * @param {unknown[]} args
 */
export function logError(...args: unknown[]): void {
  log(Level.ERROR, ...args);
}

/**
 * Add output to the critical log. Should be used for errors causing the server
 * to force shutdown, or issues leading to bad user experience.
 * @param {unknown[]} args
 */
export function logCritical(...args: unknown[]): void {
  log(Level.CRITICAL, ...args);
}

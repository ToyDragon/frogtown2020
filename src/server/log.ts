export enum Level {
  INFO = 3,
  WARNING = 2,
  ERROR = 1,
  CRITICAL = 0,
  NONE = -1,
}

let currentLogLevel = Level.INFO;
let currentLogLabel = "";

// Sets the maximum level of logs that will be displayed.
export function setLogLevel(level: number): void {
  currentLogLevel = level;
}

// Sets the label for logging.
export function setLogLabel(label: string): void {
  currentLogLabel = label;
}

interface Writable {
  write: (chunk: string) => void;
}

let writeStream: Writable | null = null;

export function setLogToStream(stream: Writable): void {
  writeStream = stream;
}

// Add output to the log with the given level
export function log(level: number, ...args: unknown[]): void {
  if (level <= currentLogLevel) {
    let foreground = -1;
    let background = -1;

    if (level === Level.INFO) {
      foreground = 248;
    }
    if (level === Level.WARNING) {
      foreground = 222;
    }
    if (level === Level.ERROR) {
      foreground = 196;
    }
    if (level === Level.CRITICAL) {
      foreground = 15;
      background = 88;
    }

    const CSI = String.fromCharCode(0x1b) + "[";
    let foregroundString = "";
    if (foreground >= 0) {
      foregroundString = `${CSI}38;5;${foreground}m`;
    }
    let backgroundString = "";
    if (background >= 0) {
      backgroundString = `${CSI}48;5;${background}m`;
    }
    if (writeStream) {
      const message = `[${currentLogLabel}]${Level[level]}:${args.join("")}\n`;
      writeStream.write(message);
    } else {
      const resetStyle = CSI + "0m";
      const message =
        `[${currentLogLabel}]${foregroundString}${backgroundString}${Level[level]}:` +
        args.join("") +
        resetStyle;
      console.log(message);
    }
  }
}

// Add output to the info log
export function logInfo(...args: unknown[]): void {
  log(Level.INFO, ...args);
}

// Add output to the info log
export function logWarning(...args: unknown[]): void {
  log(Level.WARNING, ...args);
}

// Add output to the info log
export function logError(...args: unknown[]): void {
  log(Level.ERROR, ...args);
}

// Add output to the critical log. Should be used for errors causing the server
// to force shutdown, or issues leading to bad user experience.
export function logCritical(...args: unknown[]): void {
  log(Level.CRITICAL, ...args);
}

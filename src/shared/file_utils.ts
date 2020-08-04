import * as fs from "fs";

export function stat(file: string): Promise<fs.Stats | null> {
  return new Promise((resolve) => {
    fs.stat(file, (_err, stats) => {
      resolve(stats);
    });
  });
}

export function readFile(file: string): Promise<string | null> {
  return new Promise((resolve) => {
    fs.readFile(file, (_err, data) => {
      resolve(data.toString());
    });
  });
}

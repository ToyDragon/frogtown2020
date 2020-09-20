import * as express from "express";
import Config from "../server/config";
import * as http from "http";
import * as https from "https";

/**
 * Any shared helper functions whose usefullness isn't restricted to a single area.
 */

// Generate a string containing random uppercase letters and numbers of the specified length.
export function randomString(length: number): string {
  const candidateChars = "abcdefghikjlmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; ++i) {
    result += candidateChars.charAt(candidateChars.length * Math.random());
  }
  return result;
}

// Generate a random string that can be used as a name.
export function randomName(): string {
  const adjectives = [
    "Fast",
    "Quick",
    "Hard",
    "Big",
    "Strong",
    "Weak",
    "Right",
    "Wrong",
    "Green",
    "Blue",
    "White",
    "Black",
    "Red",
    "Colorless",
    "Multicolored",
    "Round",
    "Figety",
    "Smart",
    "Focused",
    "Lightweight",
    "Heavyweight",
    "Relishing",
    "Ethereal",
    "Awesome",
    "Lenghty",
    "Moderate",
    "Searchable",
    "Thoughtful",
    "Realistic",
    "Willowed",
    "Scrying",
    "Falling",
  ];
  const nouns = [
    "Cats",
    "Dogs",
    "Farters",
    "Deck",
    "Duck",
    "Frog",
    "Combo",
    "Slowplay",
    "World",
    "Planet",
    "Bus",
    "Rain",
    "Hail",
    "Lightning",
    "Creature",
    "Spell",
    "Midrange",
    "Exile",
    "Path",
    "Life",
    "Bois",
    "Position",
    "Shot",
    "Fall",
    "Summer",
    "Spring",
    "Winter",
    "Boat",
    "Smasher",
    "Billows",
    "Wrench",
    "Tuck",
  ];
  return (
    adjectives.splice(Math.floor(Math.random() * adjectives.length), 1)[0] +
    " " +
    adjectives.splice(Math.floor(Math.random() * adjectives.length), 1)[0] +
    " " +
    nouns[Math.floor(Math.random() * nouns.length)]
  );
}

export interface UserDetails {
  publicId: string | null;
  privateId: string | null;
  ipAddress: string | null;
}

// Helper that makes it easy to enforce response types.
export function addEndpoint<T>(
  router: express.Router,
  route: string,
  cb: (user: UserDetails) => Promise<T | null>
): void {
  router.post(route, async (request, response) => {
    const userDetails: UserDetails = {
      publicId: request.cookies["publicId"] || null,
      privateId: request.cookies["privateId"] || null,
      ipAddress: request.ip,
    };
    response.end(JSON.stringify(await cb(userDetails)));
  });
}

// Helper that makes it easy to enforce response types.
export function addEndpointWithParams<R, T>(
  router: express.Router,
  route: string,
  cb: (user: UserDetails, params: R) => Promise<T | null>
): void {
  router.post(route, async (request, response) => {
    const userDetails: UserDetails = {
      publicId: request.cookies["publicId"] || null,
      privateId: request.cookies["privateId"] || null,
      ipAddress: request.ip,
    };
    response.end(
      JSON.stringify(await cb(userDetails, (request.body as unknown) as R))
    );
  });
}

// Returns a promise that resolves after a certain number of milliseconds
export function wait(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

// Turns a date into the format expected by MySQL
export function dateToMySQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function httpsGetMessage(path: string): Promise<http.IncomingMessage> {
  return new Promise((resolve) => {
    https.get(path, async (msg) => {
      if (msg.statusCode === 301) {
        const newUrl = msg.headers.location || "";
        resolve(await httpsGetMessage(newUrl));
      } else {
        resolve(msg);
      }
    });
  });
}

export function httpsGet<T>(path: string): Promise<T | null> {
  return new Promise((resolve) => {
    https.get(path, async (msg) => {
      if (msg.statusCode === 301) {
        const newUrl = msg.headers.location || "";
        resolve(await httpsGet<T>(newUrl));
      } else {
        let data = "";
        msg.on("data", (chunk) => {
          data += chunk;
        });
        msg.on("close", () => {
          let result: T | null = null;
          try {
            result = JSON.parse(data);
          } finally {
            resolve(result);
          }
        });
      }
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
    if (map) {
      for (const id in map) {
        result.push(id);
      }
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

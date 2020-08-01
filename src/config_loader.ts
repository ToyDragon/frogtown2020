import * as fs from "fs";
import Config from "./config";
import { logCritical } from "./log";

export function GetMissingConfigProperties(config: Config): string[] {
  if (!config || typeof config !== "object") {
    return ["config"];
  }

  type Rec = Record<string, unknown>;

  const recordConfig = (config as unknown) as Rec;
  const fakeConfig = (new Config() as unknown) as Rec;
  const missingProperties: string[] = [];
  for (const field in fakeConfig) {
    if (typeof recordConfig[field] === "undefined") {
      missingProperties.push(field);
    } else {
      if (typeof fakeConfig[field] === "object") {
        const fakeRecChild = (fakeConfig[field] as unknown) as Rec;
        for (const subfield in fakeRecChild) {
          const realRecChild = (recordConfig[field] as unknown) as Rec;
          if (typeof realRecChild[subfield] === "undefined") {
            missingProperties.push(field + "." + subfield);
          }
        }
      }
    }
  }
  return missingProperties;
}

export default function LoadConfigFromFile(
  config_file: string
): Promise<Config> {
  return new Promise((resolve, _reject) => {
    fs.readFile(config_file, "utf8", (err, rawData) => {
      if (err) {
        logCritical("Unable to read config file from: " + config_file);
        throw new Error();
      }
      const config = JSON.parse(rawData) as Config;

      // Check for missing attributes
      const missingProperties = GetMissingConfigProperties(config);
      if (missingProperties.length > 0) {
        logCritical(
          "Missing the following config properties: " +
            missingProperties.join(",")
        );
        throw new Error();
      }
      resolve(config);
    });
  });
}

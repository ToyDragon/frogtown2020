import StoragePortal from "./storage_portal";
import * as stream from "stream";
import * as fs from "fs";
import { Clock } from "../clock";

interface ObjectInfo {
  contents: string | Buffer;
  acl: string; // TODO: Remove this if it's not needed.
  lastChange: Date;
}

export default class MemoryStoragePortal implements StoragePortal {
  private buckets: Record<string, Record<string, ObjectInfo>> = {};
  private clock!: Clock;

  public constructor(clock: Clock) {
    this.clock = clock;
  }

  // Can retrieve an object stored as a Buffer, that was stored using a stream.
  public async getObjectRaw(
    bucket: string,
    objectKey: string
  ): Promise<Buffer | string> {
    try {
      return this.buckets[bucket][objectKey].contents;
    } catch {
      return "";
    }
  }

  public async canWriteToBucket(_bucket: string): Promise<boolean> {
    return true;
  }

  public async uploadFileToBucket(
    bucket: string,
    objectKey: string,
    filepath: string
  ): Promise<boolean> {
    try {
      this.buckets[bucket] = this.buckets[bucket] || {};
      this.buckets[bucket][objectKey] = this.buckets[bucket][objectKey] || {};
      this.buckets[bucket][objectKey].contents = await new Promise(
        (resolve) => {
          fs.readFile(filepath, (err, data) => {
            if (err) {
              throw new Error();
            }
            resolve(data);
          });
        }
      );
      this.buckets[bucket][objectKey].acl = "public-read";
      this.buckets[bucket][objectKey].lastChange = this.clock.now();

      return true;
    } catch {
      return false;
    }
  }

  public async getObjectChangedDate(
    bucket: string,
    objectKey: string
  ): Promise<string> {
    try {
      return this.buckets[bucket][objectKey].lastChange.toString();
    } catch {
      return "";
    }
  }

  public async getObjectAsString(
    bucket: string,
    objectKey: string
  ): Promise<string> {
    return (await this.getObjectRaw(bucket, objectKey)).toString();
  }

  public async uploadStringToBucket(
    bucket: string,
    objectKey: string,
    data: string
  ): Promise<boolean> {
    return this.uploadStringToBucketACL(bucket, objectKey, data, "public-read");
  }

  public async uploadStringToBucketACL(
    bucket: string,
    objectKey: string,
    data: string,
    acl: string
  ): Promise<boolean> {
    try {
      this.buckets[bucket] = this.buckets[bucket] || {};
      this.buckets[bucket][objectKey] = this.buckets[bucket][objectKey] || {};
      this.buckets[bucket][objectKey].contents = data;
      this.buckets[bucket][objectKey].acl = acl;
      this.buckets[bucket][objectKey].lastChange = this.clock.now();
      return true;
    } catch {
      return false;
    }
  }

  // Should not be used on large (>1000 item) buckets in S3, so artificially only return the first 1k.
  public async listObjects(bucket: string): Promise<string[]> {
    const result: string[] = [];
    if (this.buckets[bucket]) {
      for (const key in this.buckets[bucket]) {
        result.push(key);
        if (result.length === 1000) {
          break;
        }
      }
    }
    return result;
  }

  public uploadStreamToBucket(
    bucket: string,
    objectKey: string
  ): stream.PassThrough {
    const passthrough = new stream.PassThrough();
    passthrough.on("data", (chunk) => {
      this.buckets[bucket] = this.buckets[bucket] || {};
      this.buckets[bucket][objectKey] = this.buckets[bucket][objectKey] || {};
      if (!this.buckets[bucket][objectKey].contents) {
        this.buckets[bucket][objectKey].contents = chunk;
      } else {
        this.buckets[bucket][objectKey].contents = Buffer.concat([
          this.buckets[bucket][objectKey].contents,
          chunk,
        ]);
      }
      this.buckets[bucket][objectKey].acl = "public-read";
      this.buckets[bucket][objectKey].lastChange = this.clock.now();
    });
    return passthrough;
  }

  public async deleteObjectFromBucket(
    bucket: string,
    objectKey: string
  ): Promise<boolean> {
    this.buckets[bucket] = this.buckets[bucket] || {};
    delete this.buckets[bucket][objectKey];
    return true;
  }
}

import StoragePortal from "./storage_portal";
// eslint-disable-next-line node/no-unpublished-import
//import * as AWS from "../../node_modules/aws-sdk/index";
import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as stream from "stream";
import Config from "./config";
import * as utils from "../shared/utils";
import { logInfo, logError, logCritical } from "./log";

export default class S3StoragePortal implements StoragePortal {
  private s3: AWS.S3;

  public constructor(config: Config) {
    const key = fs
      .readFileSync(config.storage.awsAccessKeyIdFile)
      .toString()
      .trim();
    const secret = fs
      .readFileSync(config.storage.awsSecretAccessKeyFile)
      .toString()
      .trim();
    this.s3 = new AWS.S3({
      accessKeyId: key,
      secretAccessKey: secret,
    });
  }

  public async canWriteToBucket(bucket: string): Promise<boolean> {
    // Set up request
    const testObjectRequest = {
      Bucket: bucket,
      Key: utils.randomString(40),
      Body: utils.randomString(200),
      ACL: "public-read",
    };

    // Attempt upload
    let success = await new Promise<boolean>((resolve) => {
      this.s3.putObject(testObjectRequest, (err, _data) => {
        resolve(!err);
      });
    });

    // Delete object if successful
    if (success) {
      // eslint-disable-next-line prettier/prettier
      success = await this.deleteObjectFromBucket(bucket, testObjectRequest.Key);
    }
    return success;
  }

  // Upload a file to the given S3 bucket.
  public async uploadFileToBucket(
    bucket: string,
    objectKey: string,
    filepath: string
  ): Promise<boolean> {
    // Set up request
    const putObjectRequest = {
      Bucket: bucket,
      Key: objectKey,
      Body: fs.createReadStream(filepath),
      ACL: "public-read",
    };

    // Attempt upload
    const success = await new Promise<boolean>((resolve) => {
      this.s3.putObject(putObjectRequest, (err, _data) => {
        resolve(!err);
      });
    });

    return success;
  }

  public async getObjectChangedDate(
    bucket: string,
    objectKey: string
  ): Promise<string> {
    // Set up request
    const headObjectRequest = {
      Bucket: bucket,
      Key: objectKey,
    };

    // Get date
    return await new Promise<string>((resolve) => {
      this.s3.headObject(headObjectRequest, (_err, data) => {
        logInfo("Size: " + data?.ContentLength);
        resolve(data?.LastModified?.toString() || "");
      });
    });
  }

  public async getObjectAsString(
    bucket: string,
    objectKey: string
  ): Promise<string> {
    // Set up request
    const getObjectRequest = {
      Bucket: bucket,
      Key: objectKey,
    };

    // Get date
    return await new Promise<string>((resolve) => {
      this.s3.getObject(getObjectRequest, (_err, data) => {
        logInfo("Size: " + data?.ContentLength);
        logInfo("Contents: " + data?.Body?.toString());
        resolve(data?.Body?.toString() || "");
      });
    });
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
    // Set up request
    const putObjectRequest = {
      Bucket: bucket,
      Key: objectKey,
      Body: data,
      ACL: acl,
    };

    // Attempt upload
    const success = await new Promise<boolean>((resolve) => {
      this.s3.putObject(putObjectRequest, (err, _data) => {
        if (err) {
          logError("Error uploading string to S3 bucket");
          logError(err);
        }
        resolve(!err);
      });
    });

    return success;
  }

  // Should not be used on large (>1000 item) buckets. Will only return the first 1000 items.
  public listObjects(bucket: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.s3.listObjectsV2(
        {
          Bucket: bucket,
        },
        (err, data) => {
          const results: string[] = [];
          if (data.Contents) {
            for (const obj of data.Contents) {
              if (obj.Key) {
                results.push(obj.Key);
              }
            }
          }
          if (err) {
            logCritical("Error while listing S3 objects");
            logCritical(err);
          }
          if (data.IsTruncated) {
            logCritical(
              "ListObjects truncated result, shouldn't be called on large buckets."
            );
          }
          resolve(results);
        }
      );
    });
  }

  public uploadStreamToBucket(
    bucket: string,
    objectKey: string
  ): stream.PassThrough {
    const passthrough = new stream.PassThrough();
    const uploadRequest = {
      Bucket: bucket,
      Key: objectKey,
      ACL: "public-read",
      Body: passthrough,
    };
    this.s3.upload(
      uploadRequest,
      (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
        logInfo("Streaming upload complete. " + data);
        if (err) {
          logError(err);
        }
      }
    );
    return passthrough;
  }

  //Delete an object from the given S3 bucket.
  public async deleteObjectFromBucket(
    bucket: string,
    objectKey: string
  ): Promise<boolean> {
    // Set up request
    const deleteObjectRequest = {
      Bucket: bucket,
      Key: objectKey,
    };

    // Attempt delete
    const success = await new Promise<boolean>((resolve) => {
      this.s3.deleteObject(deleteObjectRequest, (err, _data) => {
        resolve(!err);
      });
    });

    return success;
  }
}

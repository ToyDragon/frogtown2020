import StoragePortal from "./storage_portal";
// eslint-disable-next-line node/no-unpublished-import
//import * as AWS from "../../node_modules/aws-sdk/index";
import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as stream from "stream";
import Config from "./config";
import * as utils from "../shared/utils";
import { logInfo, logError } from "./log";

export default class S3StoragePortal implements StoragePortal {
  private s3: AWS.S3;

  public constructor(config: Config) {
    /* eslint-disable prettier/prettier */
    this.s3 = new AWS.S3({
      accessKeyId: fs.readFileSync(config.storage.awsAccessKeyIdFile).toString(),
      secretAccessKey: fs.readFileSync(config.storage.awsSecretAccessKeyFile).toString(),
    });
    /* eslint-enable prettier/prettier */
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

  /**
   * Upload a file to the given S3 bucket.
   * @param {string} bucket
   * @param {string} objectKey
   * @param {string} filepath
   */
  // eslint-disable-next-line prettier/prettier
  public async uploadFileToBucket(bucket: string, objectKey: string, filepath: string): Promise<boolean> {
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

  /**
   * Delete an object from the given S3 bucket.
   * @param {string} bucket
   * @param {string} objectKey
   */
  // eslint-disable-next-line prettier/prettier
  public async deleteObjectFromBucket(bucket: string, objectKey: string): Promise<boolean> {
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

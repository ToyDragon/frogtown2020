import * as stream from "stream";

export default interface StoragePortal {
  canWriteToBucket(bucket: string): Promise<boolean>;
  // eslint-disable-next-line prettier/prettier
  uploadFileToBucket(bucket: string, objectKey: string, filepath: string): Promise<boolean>;
  uploadStringToBucket(
    bucket: string,
    objectKey: string,
    data: string
  ): Promise<boolean>;
  uploadStringToBucketACL(
    bucket: string,
    objectKey: string,
    data: string,
    acl: string
  ): Promise<boolean>;
  deleteObjectFromBucket(bucket: string, objectKey: string): Promise<boolean>;
  uploadStreamToBucket(bucket: string, objectKey: string): stream.PassThrough;
  getObjectChangedDate(bucket: string, objectKey: string): Promise<string>;
  getObjectAsString(bucket: string, objectKey: string): Promise<string>;
  listObjects(bucket: string): Promise<string[]>;
}

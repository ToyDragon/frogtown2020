export default interface StoragePortal {
  canWriteToBucket(bucket: string): Promise<boolean>;
  // eslint-disable-next-line prettier/prettier
  uploadFileToBucket(bucket: string, objectKey: string, filepath: string): Promise<boolean>;
  deleteObjectFromBucket(bucket: string, objectKey: string): Promise<boolean>;
}

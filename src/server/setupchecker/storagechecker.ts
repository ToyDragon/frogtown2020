import SetupIssue from "./setupissue";
import Services from "../services";

// eslint-disable-next-line prettier/prettier
export default async function CheckForStorageIssue(services: Services): Promise<SetupIssue[]> {
  const issues: SetupIssue[] = [];

  // Check that the storage portal has been configured
  if (!services.storagePortal) {
    issues.push({
      title: "Missing storage service",
      description:
        "The storage service has not properly been configured. " +
        "This likely means that AWS-S3 is enabled, but the config " +
        "information is invalid.",
    });
    return issues;
  }

  // Verify we can write to all required buckets
  const allBuckets = [
    services.config.storage.awsS3HighQualityImageBucket,
    services.config.storage.awsS3FullQualityImageBucket,
    services.config.storage.awsS3CompressedImageBucket,
    services.config.storage.awsS3DataMapBucket,
  ];
  for (const bucketName of allBuckets) {
    if (!(await services.storagePortal.canWriteToBucket(bucketName))) {
      issues.push({
        title: "Unable to write to bucket: " + bucketName,
        description:
          "Check that your AWS credentials are setup properly, " +
          "and that the permissions on the bucket allow you to upload.",
      });
    }
  }

  return issues;
}

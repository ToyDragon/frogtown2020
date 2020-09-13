import Services from "../../../server/services";
import { DataDetailsResponse } from "../handler_types";
import { logCritical } from "../../../server/log";

export async function getDataDetails(
  services: Services
): Promise<DataDetailsResponse> {
  const response: DataDetailsResponse = {
    baseURL: services.config.storage.externalRoot,
    awsS3HighQualityImageBucket:
      services.config.storage.awsS3HighQualityImageBucket,
    awsS3CompressedImageBucket:
      services.config.storage.awsS3CompressedImageBucket,
    awsS3DataMapBucket: services.config.storage.awsS3DataMapBucket,
    changeDate: "",
    imageVersion: 1, // TODO this should come out of the DB
  };
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return response;
  }
  const queryResult = await connection.query<string[]>(
    "SELECT change_time FROM data_files WHERE name=?;",
    ["map_files"]
  );
  if (queryResult.value && queryResult.value.length > 0) {
    response.changeDate = queryResult.value[0];
  } else {
    logCritical("Unable to load change time.");
  }
  connection.release();
  return response;
}

import Services from "../../../server/services";
import { MetadataRow } from "../../../server/services/database/dbinfos/db_info_metadata";
import { dateToMySQL } from "../../../shared/utils";
import { ImageVersionDetails } from "../handler_types";

export async function getImageVersionDetails(
  services: Services
): Promise<ImageVersionDetails> {
  const result: ImageVersionDetails = {
    version: 1,
    change: "",
  };
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return result;
  }

  let data = await connection.query<MetadataRow[]>(
    "SELECT * FROM metadata WHERE name=?;",
    ["image_version"]
  );
  if (!data || !data.value || data.value.length === 0) {
    connection.release();
    return result;
  }
  result.version = Number(data.value[0].value);

  data = await connection.query<MetadataRow[]>(
    "SELECT * FROM metadata WHERE name=?;",
    ["image_version_change"]
  );
  if (!data || !data.value || data.value.length === 0) {
    connection.release();
    return result;
  }
  result.change = data.value[0].value + " UTC";

  connection.release();
  return result;
}

export async function setImageVersion(
  services: Services,
  newVersion: number
): Promise<void> {
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return;
  }

  await connection.query<MetadataRow[]>(
    "REPLACE INTO metadata (name, value) VALUES (?, ?), (?, ?);",
    [
      "image_version",
      newVersion.toString(),
      "image_version_change",
      dateToMySQL(new Date()),
    ]
  );

  connection.release();
}

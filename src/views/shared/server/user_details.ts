import { UserDetailsRequest, UserDetailsResponse } from "../handler_types";
import Services from "../../../server/services";
import { UserKeysRow } from "../../../server/database/dbinfos/db_info_user_keys";

export async function getUserDetails(
  services: Services,
  params: UserDetailsRequest
): Promise<UserDetailsResponse | null> {
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return null;
  }

  const result = await connection.query<UserKeysRow[]>(
    "SELECT * FROM user_keys WHERE public_id=?;",
    [params.publicId]
  );
  connection.release();
  if (!result || !result.value || result.value.length === 0) {
    return null;
  }
  return {
    backURL: result.value[0].back_url,
    name: result.value[0].name,
  };
}

import Services from "../../../server/services";
import { ToolbarNewDeckResponse } from "../handler_types";
import { randomString, randomName, UserDetails } from "../../../shared/utils";
import { logInfo } from "../../../server/log";

export default async function createNewDeck(
  userDetails: UserDetails,
  services: Services
): Promise<ToolbarNewDeckResponse | null> {
  const newId = randomString(24);
  const newName = randomName();
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    return null;
  }

  const ownerRows = await connection.query<{ public_id: string }[]>(
    "SELECT public_id FROM user_keys WHERE private_id=?;",
    [userDetails.privateId || ""]
  );
  logInfo("Private: " + userDetails.privateId);
  logInfo("Response: " + JSON.stringify(ownerRows));
  if (!ownerRows?.value || ownerRows.value.length === 0) {
    connection.release();
    return null;
  }

  await connection.query(
    "INSERT INTO deck_keys (id, owner_id, name) VALUES (?,?,?);",
    [newId, ownerRows.value[0].public_id, newName]
  );
  connection.release();
  return {
    deckId: newId,
  };
}

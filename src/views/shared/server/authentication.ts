import { randomString } from "../../../shared/utils";
import Services from "../../../server/services";
import ConnectionContainer from "../../../server/database/db_connection_container";
import { logError, logCritical, logInfo } from "../../../server/log";
import { NewUserResponse } from "../handler_types";

export async function getPublicKeyFromPrivateKey(
  private_id: string,
  cContainer: ConnectionContainer | null,
  services: Services
): Promise<string | null> {
  cContainer = cContainer || new ConnectionContainer();
  if (!(await cContainer.push(services))) {
    return null;
  }

  // Command to get the public_id from a private_id
  const cmd = `
  SELECT public_id FROM user_keys WHERE private_id=?;
  `;
  const result = await cContainer.connection.query<string[]>(cmd, [private_id]);
  cContainer.pop();
  if (result.err) {
    return null;
  }
  return (result.value && result.value.length > 0 && result.value[0]) || "";
}

export async function getPublicKeyExists(
  public_id: string,
  cContainer: ConnectionContainer | null,
  services: Services
): Promise<boolean | null> {
  cContainer = cContainer || new ConnectionContainer();
  if (!(await cContainer.push(services))) {
    return null;
  }

  // Command to check if the public_id is already in use
  const cmd = `
  EXISTS(
    SELECT public_id FROM user_keys WHERE private_id=?
  );
  `;
  const result = await cContainer.connection.query<number>(cmd, [public_id]);
  cContainer.pop();
  return result.value === 1;
}

async function getNewPrivateKey(
  cContainer: ConnectionContainer,
  services: Services
): Promise<string | null> {
  // Repeat a few times in case we choose an ID that is already taken.
  for (let i = 0; i < 10; i++) {
    const id = randomString(64);
    const other = await getPublicKeyFromPrivateKey(id, cContainer, services);
    if (other === "") {
      return id;
    } else {
      logInfo("Private: " + id + ", public: " + JSON.stringify(other));
    }
  }

  logError("Unable to find new private user id.");
  return null;
}

async function getNewPublicKey(
  cContainer: ConnectionContainer,
  services: Services
): Promise<string | null> {
  // Repeat a few times in case we choose an ID that is already taken.
  for (let i = 0; i < 10; i++) {
    const id = randomString(24);
    if (!(await getPublicKeyExists(id, cContainer, services))) {
      return id;
    }
  }

  logError("Unable to find new public user id.");
  return null;
}

export async function createNewUser(
  services: Services
): Promise<NewUserResponse | null> {
  const cContainer = new ConnectionContainer();
  cContainer.push(services);
  let response: NewUserResponse | null = null;

  // Get new user IDs
  let newPrivateId: string | null = await getNewPrivateKey(
    cContainer,
    services
  );
  const newPublicId: string | null = await getNewPublicKey(
    cContainer,
    services
  );

  if (newPrivateId === null || newPublicId === null) {
    // If public ID is null we need to make sure private is also
    // null, because it is returned.
    newPrivateId === null;
  } else {
    // Insert user into database
    const cmd = `
    INSERT INTO user_keys (private_id, public_id, back_url, name) VALUES (?, ?, ?, ?);
    `;
    const result = await cContainer.connection.query<void>(cmd, [
      newPrivateId,
      newPublicId,
      "",
      "",
    ]);

    if (result.err) {
      logCritical(result.err);
      logCritical("Failed to add new user to database.");
      newPrivateId = null;
    } else {
      logInfo("Added new user " + newPublicId);
      response = {
        privateId: newPrivateId,
        publicId: newPublicId,
      };
    }
  }

  cContainer.pop();
  return response;
}

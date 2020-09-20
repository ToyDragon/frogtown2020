import { DatabaseConnection } from "../../server/database/db_connection";
import { BatchStatusRow } from "../../server/database/dbinfos/db_info_batch_status";

export async function isBatchInProgress(
  connection: DatabaseConnection
): Promise<boolean> {
  const result = await connection.query<BatchStatusRow>(
    `
    LOCK TABLES batch_status READ;
    SELECT * FROM batch_status WHERE name=?;
    UNLOCK TABLES;
    `,
    ["in_progress"]
  );
  return result?.value?.value === "true";
}

function getLineZeroValue(result: BatchStatusRow[] | null): string {
  if (!result || result.length === 0 || !result[0]) {
    return "";
  }
  return result[0].value;
}

export async function trySetBatchInProgress(
  connection: DatabaseConnection
): Promise<boolean> {
  await connection.query("LOCK TABLES batch_status WRITE;", []);
  let result = await connection.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status WHERE name=?;",
    ["in_progress"]
  );

  if (getLineZeroValue(result.value) === "true") {
    await connection.query<BatchStatusRow[]>("UNLOCK TABLES;", []);
    return false;
  } else {
    result = await connection.query<BatchStatusRow[]>(
      "REPLACE INTO batch_status (name, value) VALUES(?, ?);",
      ["in_progress", "true"]
    );
    await connection.query("UNLOCK TABLES;", []);
    return true;
  }
}

export async function endBatch(connection: DatabaseConnection): Promise<void> {
  await connection.query("LOCK TABLES batch_status WRITE;", []);
  await connection.query(
    "REPLACE INTO batch_status (name, value) VALUES(?, ?);",
    ["in_progress", "false"]
  );
  await connection.query("UNLOCK TABLES;", []);
}
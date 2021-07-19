import Config from "../config/config";
import { BatchStatusRow } from "./dbinfos/db_info_batch_status";
import initializeDatabase from "./initialize_database";
import MemoryDatabaseManager from "./memory_db_manager";

test("can initialize and store a value", async () => {
  const manager = new MemoryDatabaseManager();
  await initializeDatabase(manager, new Config());
  const conn = await manager.getConnection();
  await conn!.query<void>(
    "REPLACE INTO batch_status (name, value) VALUES (?, ?);",
    ["test_property", "test_value"]
  );
  const result = await conn!.query<BatchStatusRow[]>(
    "SELECT * FROM batch_status;",
    []
  );
  expect(result.err).toBeNull();
  expect(result.value).toEqual([
    {
      name: "test_property",
      value: "test_value",
    },
  ]);
});

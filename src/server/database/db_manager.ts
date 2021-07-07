import Config from "../config";
import { DatabaseActionResult } from "./db_action_result";
import { DatabaseConnection } from "./db_connection";

export interface RawDatabaseConnection {
  query: (query: string) => Promise<DatabaseActionResult<string[]>>;
}

export default interface DatabaseManager {
  getConnection(): Promise<DatabaseConnection | null>;
  getConnectionTimeout(
    timeoutMillis: number
  ): Promise<DatabaseConnection | null>;

  getCreateTableSuffix(): string;
  ensureDatabaseExists(config: Config): Promise<boolean>;

  // Should only be called during initial set up when pools are not available.
  getRawDatabaseConnection(config: Config): Promise<RawDatabaseConnection>;
}

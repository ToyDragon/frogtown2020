import { DatabaseConnection } from "../db_connection";
import { logCritical } from "../../log";

export abstract class DBInfo {
  public async ensureTableExists(
    connection: DatabaseConnection
  ): Promise<boolean> {
    // Perform creation and check for errors.
    const result = await connection.query(this.getCreateCommand(), []);
    if (result.err) {
      logCritical("Error while ensuring required database tables exist.");
      logCritical(result.err);
      connection.release();
      return false;
    }
    return true;
  }

  public abstract getCreateCommand(): string;
}

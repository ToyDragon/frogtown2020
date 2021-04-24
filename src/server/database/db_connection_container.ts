import Services from "../services";
import { logCritical } from "../log";
import { DatabaseConnection } from "./db_connection";

export default class ConnectionContainer {
  public connection!: DatabaseConnection;

  private depth: number;
  private connectionPromise: Promise<void> | null = null;

  public constructor() {
    this.depth = 0;
  }

  public async push(services: Services): Promise<boolean> {
    this.depth += 1;
    if (this.depth === 1) {
      let resolver: () => void;
      this.connectionPromise = new Promise((resolve) => {
        resolver = resolve;
      });

      const tempConnection = await services.dbManager.getConnection();
      if (tempConnection === null) {
        return false;
      }
      this.connection = tempConnection;
      this.connectionPromise = null;
      resolver!();
    } else if (this.connectionPromise) {
      await this.connectionPromise;
    }
    return true;
  }

  public pop(): void {
    if (this.depth <= 0) {
      logCritical(
        "Trying to pop a connection container with no open connection."
      );
    } else {
      this.depth -= 1;
      if (this.depth === 0) {
        this.connection.release();
      }
    }
  }
}

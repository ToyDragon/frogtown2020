import StoragePortal from "./storage_portal";
import Config from "./config";
import DatabaseManager from "./database/mysql_db_manager";
import ScryfallManager from "./scryfall_manager";
import { PerformanceMonitor } from "./performance_monitor/performance_monitor";
import LocalStorage from "./local_storage/local_storage";

/**
 * Global services configured for the server. These are passed around in a
 * Services object so that individual components and more easily be tested.
 */
export default interface Services {
  storagePortal: StoragePortal;
  dbManager: DatabaseManager;
  config: Config;
  scryfallManager: ScryfallManager;
  perfMon: PerformanceMonitor;
  file: LocalStorage;
}

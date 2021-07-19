import StoragePortal from "./services/storage_portal/storage_portal";
import Config from "./services/config/config";
import DatabaseManager from "./services/database/db_manager";
import ScryfallManager from "./services/scryfall_manager/scryfall_manager";
import { PerformanceMonitor } from "./services/performance_monitor/performance_monitor";
import LocalStorage from "./services/local_storage/local_storage";
import { Clock } from "./services/clock";
import NetworkManager from "./services/network_manager/network_manager";

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
  clock: Clock;
  net: NetworkManager;
}

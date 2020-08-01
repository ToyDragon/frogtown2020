import StoragePortal from "./storage_portal";
import Config from "./config";

/**
 * Global services configured for the server. These are passed around in a
 * Services object so that individual components and more easily be tested.
 */
export default interface Services {
  storagePortal: StoragePortal;
  config: Config;
}

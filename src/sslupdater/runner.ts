
import * as os from "os";
import commandLineArgs from "command-line-args";

import Config from "../server/config";
import Services from "../server/services";
import LoadConfigFromFile from "../server/config_loader";
import S3StoragePortal from "../server/storage_portal_s3";
import * as Logs from "../server/log";
import DatabaseManager from "../server/database/db_manager";
import ScryfallManager from "../server/scryfall_manager";
import {
  initStatusManagement,
  logGracefulDeath,
} from "../server/status_manager";
import { setServerName } from "../server/name";
import { timeout } from "../shared/utils";
import * as fs from "fs";
import { spawn } from "child_process";

export default class SSLUpdater {
  private services!: Services;

  public run(): void {
    // Setup command line params
    const options = commandLineArgs([
      {
        name: "config",
        alias: "c",
        type: String,
        defaultValue: "./config.json",
      },
      {
        name: "loglevel",
        alias: "l",
        type: Number,
        defaultValue: Logs.Level.INFO,
      },
    ]);

    // Initial some global stuff
    Logs.setLogLevel(options["loglevel"]);
    Logs.setLogLabel(process.pid.toString());

    // Load config
    LoadConfigFromFile(options["config"]).then(async (config: Config) => {
      Logs.logInfo("Loaded config.");
      this.services = {
        config: config,
        dbManager: new DatabaseManager(config),
        storagePortal: new S3StoragePortal(config),
        scryfallManager: new ScryfallManager(),
      };

      process.on("SIGINT", async () => {
        Logs.logWarning("SIGINT recieved.");
        await logGracefulDeath(this.services);
        await timeout(2000);
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      });

      // Initialize the database
      await this.services.dbManager.ensureDatabaseAndTablesExist(config);

      // Heartbeats and server status managment
      setServerName(process.pid.toString() + ":Updater:" + os.hostname());
      await initStatusManagement(this.services);

      this.updateCerts();
    });
}

  private deleteAndRemake(name: string): void {
    if(fs.existsSync(name)) {
      fs.rmdirSync(name, {recursive: true});
    }
    fs.mkdirSync(name);
  }

  private async updateCerts(): Promise<void> {
    this.deleteAndRemake("./ssl_tmp");

    const process = spawn("certbot", ["certonly", "--manual", "-d", "beta.frogtown.me"]);
    process.stderr.on("data", (chunk) => {
      Logs.logWarning("err: " + chunk);
    });
    process.stdout.on("data", async (chunk) => {
      Logs.logWarning("data: " + chunk);
      const result = /Create a file containing just this data:\n\n(.*)\n\n.*\n\n.*\.well-known\/acme-challenge\/(.*)\n/.exec(chunk);
      if (result) {
        Logs.logInfo("Uploading \"" + result[1] + "\" to \"" + result[2] + "\"")
        await this.services.storagePortal.uploadStringToBucketACL(this.services.config.storage.awsS3WellKnownBucket, result[2], result[1], "private");
        Logs.logInfo("done");
      }
    });
  }
}

new SSLUpdater().run();
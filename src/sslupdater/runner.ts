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
import { httpsGetRaw, timeout } from "../shared/utils";
import { spawn, execSync } from "child_process";
import { PerformanceMonitor } from "../server/performance_monitor/performance_monitor";

/*

Updating SSL Keys
=================

Run this script as admin:

$> sudo npm run ssl

It should operate certbot to get a new cert, store it in ./secrets/ssl, and then
upload it as a secret to the cluster. Pods in the cluster should consume the
secret and have updated certs the next time they restart. They should restart on
their own in a reasonable amount of time, but if not you can force them to
restart from frogtown.me/serverstatus.html

Certificates only last 3 months, set this up in a chron job ideally.

*/

// TODO have this update beta and prod

export default class SSLUpdater {
  private services!: Services;
  private serverInfo = {
    url: "",
    vLabel: "",
    gcp: "",
    secretName: "",
  };

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
      {
        name: "ver",
        alias: "v",
        type: String,
        defaultValue: Logs.Level.INFO,
      },
    ]);

    if (options["ver"] === "prod") {
      this.serverInfo.url = "www.frogtown.me";
      this.serverInfo.vLabel = "prod";
      this.serverInfo.gcp = "frogtown-prod-a";
      this.serverInfo.secretName = "prodsslkeys";
    } else {
      this.serverInfo.url = "beta.frogtown.me";
      this.serverInfo.vLabel = "beta";
      this.serverInfo.gcp = "website-1";
      this.serverInfo.secretName = "sslkeys";
    }

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
        perfMon: new PerformanceMonitor(),
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

  private async updateCerts(): Promise<void> {
    Logs.logInfo("running 'sudo certbot'");
    const certprocess = spawn("sudo", [
      "certbot",
      "certonly",
      "--manual",
      "-d",
      this.serverInfo.url,
    ]);
    certprocess.stderr.on("data", (chunk) => {
      Logs.logWarning("err: " + chunk);
    });
    certprocess.stdout.on("data", async (chunk: string) => {
      Logs.logWarning("data: " + chunk);
      const result = /Create a file containing just this data:\n\n(.*)\n\n.*\n\n.*\.well-known\/acme-challenge\/(.*)\n/.exec(
        chunk
      );
      if (result) {
        Logs.logInfo(`Uploading "${result[1]}" to "${result[2]}"`);
        await this.services.storagePortal.uploadStringToBucketACL(
          this.services.config.storage.awsS3WellKnownBucket,
          result[2],
          result[1],
          "private"
        );
        Logs.logInfo("Waiting for data to be available...");
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const getData = await httpsGetRaw(
            `https://${this.serverInfo.url}/.well-known/acme-challenge/${result[2]}`
          );
          Logs.logInfo("Data: " + getData);
          if (getData) {
            break;
          }
          await timeout(3000);
        }
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";
        certprocess.stdin.write("\n"); // New line to trigger validation
      } else if (
        chunk.indexOf("Your certificate and chain have been saved at:") >= 0 ||
        chunk.indexOf("You have an existing certificate that has exactly") >=
          0 ||
        chunk.indexOf("Certificate is saved at:") >= 0
      ) {
        if (
          chunk.indexOf("You have an existing certificate that has exactly") >=
          0
        ) {
          certprocess.stdin.write("c\n");
          await timeout(3000);
        }
        this.copyAndDeployCerts();
      }
    });
  }

  private async copyAndDeployCerts(): Promise<void> {
    const dateStr = new Date().toISOString();
    // try {
    //   fs.mkdirSync("./secrets/ssl");
    // } catch {}
    // const dateStr = new Date().toISOString();
    // try {
    //   fs.mkdirSync("./secrets/ssl/" + dateStr);
    // } catch {}
    execSync(
      [
        "sudo",
        "mkdir",
        "-p",
        `"./secrets/ssl/${this.serverInfo.vLabel}/${dateStr}"`,
      ].join(" ")
    );

    execSync(
      [
        "sudo",
        "cp",
        `"/etc/letsencrypt/live/${this.serverInfo.url}/fullchain.pem"`,
        `"./secrets/ssl/${this.serverInfo.vLabel}/${dateStr}/fullchain.pem"`,
      ].join(" ")
    );
    execSync(
      [
        "sudo",
        "cp",
        `"/etc/letsencrypt/live/${this.serverInfo.url}/privkey.pem"`,
        `"./secrets/ssl/${this.serverInfo.vLabel}/${dateStr}/privkey.pem"`,
      ].join(" ")
    );
    // execSync([
    //   "sudo",
    //   "chown",
    //   "frog:frog",
    //   "./secrets/ssl/" + dateStr + "/*",
    // ].join(" "));
    // fs.copyFileSync("/etc/letsencrypt/live/beta.frogtown.me/fullchain.pem", "./secrets/ssl/" + dateStr + "/fullchain.pem");
    // fs.copyFileSync("/etc/letsencrypt/live/beta.frogtown.me/privkey.pem", "./secrets/ssl/" + dateStr + "/privkey.pem");

    Logs.logInfo(`Uploading secret: ${this.serverInfo.secretName}`);
    execSync(
      `sudo gcloud container clusters get-credentials ${this.serverInfo.gcp} --region=us-central1-c`
    );
    execSync(`sudo kubectl delete secret ${this.serverInfo.secretName}`);
    const result = execSync(
      `sudo kubectl create secret generic ${this.serverInfo.secretName} --from-file ./secrets/ssl/${this.serverInfo.vLabel}/` +
        dateStr +
        `/fullchain.pem --from-file ./secrets/ssl/${this.serverInfo.vLabel}/` +
        dateStr +
        "/privkey.pem"
    );
    Logs.logInfo("Upload result: " + JSON.stringify(result));

    Logs.logInfo("Done, exiting.");
    await logGracefulDeath(this.services);
    await timeout(3000);
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
}

new SSLUpdater().run();

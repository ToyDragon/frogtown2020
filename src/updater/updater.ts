import * as os from "os";
import commandLineArgs from "command-line-args";

import Config from "../server/config";
import Services from "../server/services";
import LoadConfigFromFile from "../server/config_loader";
import S3StoragePortal from "../server/storage_portal_s3";
import * as Logs from "../server/log";
import ScryfallManager from "../server/scryfall_manager";
import {
  initStatusManagement,
  logGracefulDeath,
} from "../server/status_manager";
import { setServerName } from "../server/name";
import { timeout } from "../shared/utils";
import { BatchStatusRow } from "../server/database/dbinfos/db_info_batch_status";
import { DataFilesRow } from "../server/database/dbinfos/db_info_data_files";
import { DatabaseConnection } from "../server/database/db_connection";
import {
  BulkDataListing,
  startConstructingDataMaps,
  startDownloadNewAllCardsFile,
} from "../views/tools/data_management";
import { isBatchInProgress } from "../views/tools/batch_status";
import { downloadMissingSVGs } from "../views/tools/svg_management";
import {
  getAllImageInfos,
  startUpdatingImages,
} from "../views/tools/image_management";
import {
  getImageVersionDetails,
  setImageVersion,
} from "../views/shared/server/image_version";
import { PerformanceMonitor } from "../server/performance_monitor/performance_monitor";
import initializeDatabase from "../server/database/initialize_database";
import MySQLDatabaseManager from "../server/database/mysql_db_manager";

export default class Updater {
  private services!: Services;
  private checkInProgress = false;

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
        dbManager: new MySQLDatabaseManager(config),
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
      await initializeDatabase(this.services.dbManager, config);

      // Heartbeats and server status managment
      setServerName(process.pid.toString() + ":Updater:" + os.hostname());
      await initStatusManagement(this.services);

      setInterval(() => {
        this.checkForAction();
      }, 15 * 60 * 1000); // 15 minutes
      this.checkForAction();
    });
  }

  private async getAllCardsUpdateDate(
    connection: DatabaseConnection
  ): Promise<Date | null> {
    const allDataRows = await connection.query<DataFilesRow[]>(
      "SELECT * FROM data_files WHERE name=?;",
      ["all_cards"]
    );
    let allCardsUpdateDate: Date | null = null;
    if (allDataRows?.value?.length === 1) {
      allCardsUpdateDate = new Date(allDataRows.value[0].update_time + " UTC");
    }
    return allCardsUpdateDate;
  }

  private async getScryfallAllCardsUpdateDate(): Promise<Date | null> {
    const bulkdataResponse = await this.services.scryfallManager.request<
      BulkDataListing
    >("https://api.scryfall.com/bulk-data");
    let allCardsChangedDate = "";
    if (bulkdataResponse && bulkdataResponse.data) {
      for (const group of bulkdataResponse.data) {
        if (group.type === "all_cards") {
          allCardsChangedDate = group.updated_at;
        }
      }
    }
    if (!allCardsChangedDate) {
      return null;
    }
    return new Date(allCardsChangedDate);
  }

  private async updateState(
    connection: DatabaseConnection,
    newState: number
  ): Promise<void> {
    await connection.query<BatchStatusRow[]>(
      "REPLACE INTO batch_status (name, value) VALUES(?, ?)",
      ["updater_state", newState.toString()]
    );
  }

  private async waitForBatchEnd(
    connection: DatabaseConnection
  ): Promise<boolean> {
    let done = false;
    // Wait up to an hour for it to finish
    for (let i = 0; i < 60; i++) {
      if (!(await isBatchInProgress(connection))) {
        done = true;
        break;
      } else {
        Logs.logInfo("Waiting another minute...");
        await timeout(60 * 1000);
      }
    }
    return done;
  }

  private async shouldUpdateDataMaps(
    connection: DatabaseConnection
  ): Promise<boolean> {
    const s3UpdateDate = new Date(
      await this.services.storagePortal.getObjectChangedDate(
        this.services.config.storage.awsS3DataMapBucket,
        "AllData.json"
      )
    );
    let allDataRows = await connection.query<DataFilesRow[]>(
      "SELECT * FROM data_files WHERE name=?;",
      ["map_files"]
    );
    if (allDataRows?.value?.length !== 1) {
      return true;
    }
    const dataFileChanged = new Date(allDataRows.value[0].change_time + " UTC");
    allDataRows = await connection.query<DataFilesRow[]>(
      "SELECT * FROM data_files WHERE name=?;",
      ["all_cards"]
    );
    if (allDataRows?.value?.length !== 1) {
      Logs.logInfo(
        "No need to update data maps, because no all_cards date available."
      );
      return false;
    }
    const allCardsFileChanged = new Date(
      allDataRows.value[0].change_time + " UTC"
    );
    if (dataFileChanged > allCardsFileChanged) {
      Logs.logInfo(
        "Data maps should not update, they are newer than the all_cards file."
      );
      return false;
    }
    if (allCardsFileChanged > s3UpdateDate) {
      Logs.logInfo(
        "Data maps should not update, waiting on s3 to update the all_cards object."
      );
      Logs.logInfo("all_cards downloaded: " + allCardsFileChanged);
      Logs.logInfo("s3 update date: " + s3UpdateDate);
      return false;
    }
    if (allCardsFileChanged > s3UpdateDate) {
      Logs.logInfo(
        "Data maps should not update, waiting on s3 to update the all_cards object."
      );
      Logs.logInfo("all_cards downloaded: " + allCardsFileChanged);
      Logs.logInfo("s3 update date: " + s3UpdateDate);
      return false;
    }
    Logs.logInfo(
      "Data maps should update. Built " +
        dataFileChanged +
        ", with S3 available " +
        s3UpdateDate +
        ", with all cards update " +
        allCardsFileChanged
    );
    return true;
  }

  private async shouldUpdateAllCards(
    connection: DatabaseConnection
  ): Promise<boolean> {
    const allCardsUpdateDate: Date | null = await this.getAllCardsUpdateDate(
      connection
    );
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (allCardsUpdateDate && allCardsUpdateDate < oneDayAgo) {
      const scryfallUpdateDate = await this.getScryfallAllCardsUpdateDate();
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      if (
        scryfallUpdateDate &&
        scryfallUpdateDate > allCardsUpdateDate // Newer than what we have
      ) {
        if (scryfallUpdateDate < twoHoursAgo) {
          return true;
        } else {
          const hours =
            (new Date().getTime() - scryfallUpdateDate.getTime()) /
            (1000 * 60 * 60);
          Logs.logInfo(
            "Scryfall all cards too new, letting it stabilize. It's only been " +
              hours +
              " hours."
          );
        }
      } else {
        Logs.logInfo("Scryfall all cards version not newer than ours");
      }
    } else {
      Logs.logInfo("All cards file not a day old yet...");
    }
    return false;
  }

  private async checkBatchStatus(
    connection: DatabaseConnection
  ): Promise<boolean> {
    const result = await connection.query<BatchStatusRow[]>(
      "SELECT * FROM batch_status;",
      []
    );
    if (!result || !result.value) {
      Logs.logError("Unable to load batch state.");
      return true;
    }
    let inProgress = false;
    let owner = "";
    for (const row of result.value) {
      if (row.name === "in_progress") {
        inProgress = row.value === "true";
      }
      if (row.name === "batch_owner_name") {
        owner = row.value;
      }
    }

    if (inProgress && owner.indexOf("Updater") > 0) {
      Logs.logWarning("Clearing batch status from previous updater...");
      await connection.query<BatchStatusRow[]>(
        "REPLACE INTO batch_status (name, value) VALUES(?, ?), (?, ?), (?, ?), (?, ?);",
        [
          "in_progress",
          "false",
          "batch_owner_name",
          "",
          "all_cards_download_in_progress",
          "false",
          "construct_maps_in_progress",
          "false",
        ]
      );
      inProgress = false;
    }
    return inProgress;
  }

  private async getStoredState(
    connection: DatabaseConnection
  ): Promise<number> {
    const stateResult = await connection.query<BatchStatusRow[]>(
      "SELECT * FROM batch_status WHERE name=?;",
      ["updater_state"]
    );
    if (stateResult?.value?.length === 1) {
      return Number(stateResult.value[0].value);
    }
    return 0;
  }

  private async checkForAction(): Promise<void> {
    if (this.checkInProgress) {
      return;
    }
    this.checkInProgress = false;
    const connection = await this.services.dbManager.getConnectionTimeout(
      2 * 60 * 60 * 1000 // 2 hours
    );
    if (!connection) {
      return;
    }
    let state = await this.getStoredState(connection);
    Logs.logInfo("Loaded state " + state);

    if (await this.checkBatchStatus(connection)) {
      Logs.logWarning("Waiting for existing batch to end...");
      return;
    }

    if (state === 0) {
      //State 0- checking for all cards file update, or data maps update
      Logs.logInfo("Checking if all cards file should be updated.");
      if (await this.shouldUpdateAllCards(connection)) {
        await this.updateState(connection, 1);
        state = 1;
      } else {
        if (await this.shouldUpdateDataMaps(connection)) {
          Logs.logInfo("Constructing data maps...");
          await startConstructingDataMaps(this.services);
          await this.updateState(connection, 2);
          state = 2;
          Logs.logInfo("Done constructing data maps.");
        } else {
          Logs.logInfo("No update necessary.");
        }
      }
    }

    if (state === 1) {
      //State 1- all cards file
      //   Download new all cards file
      //   go to state 0
      Logs.logInfo("Starting download of all cards file...");
      await startDownloadNewAllCardsFile(this.services);
      if (await this.waitForBatchEnd(connection)) {
        await this.updateState(connection, 0);
        state = 0;
        Logs.logInfo("Done downloading all cards.");
      } else {
        Logs.logError("Unknown error downloading all cards.");
      }
    }

    if (state === 2) {
      //State 2- updating images
      //   download any missing SVGs
      //   download any missing cards
      //   Increment card version
      //   Go to state 0
      await downloadMissingSVGs(this.services);
      Logs.logInfo("Loading cards missing images...");
      const result = await getAllImageInfos(this.services);
      if (result) {
        await startUpdatingImages(this.services, {
          allMissingCards: false,
          cardIds: result.cardsMissingWithLQAvailable.concat(
            result.cardsNotHQWithHQAvailable
          ),
        });
        if (await this.waitForBatchEnd(connection)) {
          if (
            result.cardsMissingWithLQAvailable.length +
              result.cardsNotHQWithHQAvailable.length >
            0
          ) {
            const version = await getImageVersionDetails(this.services);
            Logs.logInfo("Setting image version to " + (version.version + 1));
            await setImageVersion(this.services, version.version + 1);
          }

          this.updateState(connection, 0);
          state = 0;

          Logs.logInfo("Done with automatic update.");
        } else {
          Logs.logError("Unable to download images.");
        }
      } else {
        Logs.logError("Unable to load cards missing images.");
      }
    }

    this.checkInProgress = false;
    connection.release();
  }
}

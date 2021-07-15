import * as os from "os";
import commandLineArgs from "command-line-args";

import Config from "../server/services/config/config";
import Services from "../server/services";
import LoadConfigFromFile from "../server/services/config/config_loader";
import S3StoragePortal from "../server/services/storage_portal/storage_portal_s3";
import * as Logs from "../server/log";
import RealScryfallManager from "../server/services/scryfall_manager/real_scryfall_manager";
import {
  initStatusManagement,
  logGracefulDeath,
} from "../server/status_manager";
import { setServerName } from "../server/name";
import { timeout, UserDetails } from "../shared/utils";
import { Collection, MongoClient, Db, ObjectID } from "mongodb";
import * as Authentication from "../views/shared/server/authentication";
import { UserKeysRow } from "../server/services/database/dbinfos/db_info_user_keys";
import createNewDeck from "../views/shared/server/deck_creator";
import { SetDeckMetadata, UpdateDeckCards } from "../views/deckviewer/handler";
import { DeckKeysRow } from "../server/services/database/dbinfos/db_info_deck_keys";
import { DatabaseConnection } from "../server/services/database/db_connection";
import { PerformanceMonitor } from "../server/services/performance_monitor/performance_monitor";
import initializeDatabase from "../server/services/database/initialize_database";
import MySQLDatabaseManager from "../server/services/database/mysql_db_manager";
import FsLocalStorage from "../server/services/local_storage/fs_local_storage";
import RealClock from "../server/services/real_clock";
import RealNetworkManager from "../server/services/network_manager/real_network_manager";

/*

Moving data from old site to new site
=================

This is a short lived project to move data to the new SQL database, from the old mongo database. Delete it once the transition is complete.

*/

interface MongoCollections {
  users: Collection;
  clients: Collection;
  decks: Collection;
  conversions: Collection;
  misc: Collection;
}

interface OldUserData {
  _id: string;
  privateId: string;
  decks: string[];
  name?: string;
  ttsBackLink?: string;
}

export default class Converter {
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
        dbManager: new MySQLDatabaseManager(config),
        storagePortal: new S3StoragePortal(config),
        scryfallManager: new RealScryfallManager(),
        perfMon: new PerformanceMonitor(),
        file: new FsLocalStorage(),
        clock: new RealClock(),
        net: new RealNetworkManager(),
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

      await this.LoadDB();
      let connection = await this.services.dbManager.getConnectionTimeout(
        1000 * 60 * 60
      );
      if (!connection) {
        return;
      }
      const all_users: OldUserData[] = [];
      await this.cols.users.find({}).forEach((user) => {
        all_users.push(user);
      });
      Logs.logInfo(`Considering ${all_users.length} users`);
      let users_with_non_empty_decks = 0;
      let skipping = true;
      let skip_count = 0;
      let conn_users = 0;
      for (const user of all_users) {
        if (
          !user ||
          !user.decks ||
          user.decks.length === 0 ||
          user.privateId?.length !== 64 ||
          user._id?.toString()?.length !== 24
        ) {
          continue;
        }
        const public_id = user._id.toString();
        /*
          The entire conversion takes several days, and there's some bug
          where the runner will crash consistently after ~12 hours. When
          that happens, put the most recently tried private ID in this
          field, and progress will be resumed from there.
        */
        const skipId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        if (skipping) {
          if (user.privateId === skipId) {
            skipping = false;
            Logs.logInfo(`Skipped ${skip_count} users to catch up.`);

            const decks = await connection.query<DeckKeysRow[]>(
              "SELECT * FROM deck_keys WHERE owner_id=?;",
              [public_id]
            );
            if (decks.value) {
              for (const deck of decks.value) {
                await connection.query<void>(
                  "DELETE FROM deck_keys WHERE id=?;",
                  [deck.id]
                );
                await connection.query<void>(
                  "DELETE FROM deck_cards WHERE deck_id=?;",
                  [deck.id]
                );
              }
            }
          } else {
            skip_count++;
            continue;
          }
        }
        conn_users++;
        if (conn_users > 4000) {
          conn_users = 0;
          connection.release();
          connection = await this.services.dbManager.getConnectionTimeout(
            1000 * 60 * 60
          );
          if (!connection) {
            return;
          }
        }

        Logs.logInfo(
          `Trying to create user with private id: ${user.privateId} and public ${public_id}`
        );
        const existing = await Authentication.getPublicKeyFromPrivateKey(
          user.privateId,
          null,
          this.services
        );
        Logs.logInfo("Existing id: " + JSON.stringify(existing));
        if (existing === "") {
          await Authentication.createNewUserWithIds(
            connection,
            user.privateId,
            public_id
          );
        }
        const user_details = {
          privateId: user.privateId,
          ipAddress: null,
          publicId: public_id,
        };

        // Copy over user settings
        if (user.name) {
          Logs.logInfo("setting name");
          await connection.query<UserKeysRow[]>(
            "UPDATE user_keys SET name=? WHERE private_id=?;",
            [user.name, user.privateId]
          );
        }
        if (user.ttsBackLink) {
          Logs.logInfo("setting ttsback");
          await connection.query<UserKeysRow[]>(
            "UPDATE user_keys SET back_url=? WHERE private_id=?;",
            [user.ttsBackLink, user.privateId]
          );
        }

        // Copy over decks
        const all_promises: Promise<unknown>[] = [];
        let first_deck = true;
        for (const deck_id of user.decks) {
          const promise = this.CopyDeck(deck_id, user_details, connection);
          all_promises.push(promise);
          promise.then((had_cards) => {
            if (had_cards && first_deck) {
              users_with_non_empty_decks++;
              first_deck = false;
              Logs.logInfo(
                "Processed " +
                  users_with_non_empty_decks +
                  " user with nonempty deck"
              );
            }
          });
        }
        await Promise.all(all_promises);
      }
      Logs.logInfo(
        `Processed ${users_with_non_empty_decks} users with nonempty deck`
      );
      Logs.logInfo("Done, shutting down in 2 seconds...");
      await logGracefulDeath(this.services);
      await timeout(2000);
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
  }

  private CopyDeck(
    deck_id: string,
    user_details: UserDetails,
    connection: DatabaseConnection
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let had_cards = false;
      (async () => {
        const new_deck_id = await createNewDeck(user_details, this.services);
        if (!new_deck_id) {
          console.log("Error creating new deck");
          return;
        }
        const deck = await this.cols.decks.findOne({
          _id: new ObjectID(deck_id),
        });
        if (!deck || !deck.name || (!deck.mainboard && !deck.sideboard)) {
          return;
        }
        await SetDeckMetadata(
          user_details,
          {
            deckId: new_deck_id.deckId,
            name: deck.name,
            keyCard: null,
          },
          connection
        );
        await UpdateDeckCards(
          user_details,
          {
            deckId: new_deck_id.deckId,
            mainboard: deck.mainboard,
            sideboard: deck.sideboard,
            cardCount: 0,
            colors: [],
          },
          connection
        );
        had_cards = deck.mainboard.length > 0 || deck.sideboard.length > 0;
      })().then(() => {
        resolve(had_cards);
      });
    });
  }

  private LoadDB(): Promise<void> {
    return new Promise((resolve) => {
      const dburl = "mongodb://localhost:27017/";
      console.log("Connecting to " + dburl);
      MongoClient.connect(dburl, (err, dbobj) => {
        if (err) {
          throw "Unable to connect to Mongo DB";
        }
        //this.client = dbobj;
        this.db = dbobj.db("frogtown");

        this.db.stats((err, data) => {
          if (err) {
            console.log("err " + JSON.stringify(err));
            return;
          }
          console.log(JSON.stringify(data));
        });

        this.cols = {
          users: this.db.collection("users"),
          clients: this.db.collection("clients"),
          decks: this.db.collection("decks"),
          conversions: this.db.collection("conversions"),
          misc: this.db.collection("misc"),
        };
        resolve();
      });
    });
  }

  private db!: Db;
  //private client!: MongoClient;
  private cols!: MongoCollections;
}

new Converter().run();

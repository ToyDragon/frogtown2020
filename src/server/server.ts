import express from "express";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import * as os from "os";
import * as bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import commandLineArgs from "command-line-args";

import Config from "./config";
import Services from "./services";
import LoadConfigFromFile from "./config_loader";
import S3StoragePortal from "./storage_portal_s3";
import ErrorHandler from "./handler_error";
import NotFoundHandler from "./handler_not_found";
import HTTPSRedirectionHandler from "./handler_https_redirection";
import SetupRequiredHandler from "./handler_setup";
import ViewHandler from "./handler_views";
import * as Logs from "./log";
import DatabaseManager from "./database/db_manager";
import ScryfallManager from "./scryfall_manager";
import ImagesHandler from "./handler_images";
import { initStatusManagement, logGracefulDeath } from "./status_manager";
import { setServerName } from "./name";
import { timeout } from "../shared/utils";
import WellKnownHandler from "./handler_wellknown";
import { PerformanceMonitor } from "./performance_monitor/performance_monitor";
import { PerformanceLogger } from "./performance_monitor/performance_logger";

export default class Server {
  public run(serverLabel: string): void {
    const perfMon = new PerformanceMonitor();
    const perfStartup = perfMon.StartSession("server startup");

    // Setup shutdown procedure
    let onDie: (() => Promise<void>) | null = null;
    process.on("SIGINT", async () => {
      Logs.logWarning("SIGINT recieved.");
      // TODO: theres gotta be a better way to support dying.
      // Let long running jobs know so they can die gracefully.
      if (onDie) {
        await onDie();
      }
      Logs.logInfo("about to wait more");
      await timeout(2000);
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });

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
    Logs.setLogLabel(serverLabel);

    // Create the primary server
    const app = express();

    // View engine setup
    app.set("views", "./views");
    app.set("view engine", "ejs");

    // Performance monitoring middleware
    app.use(PerformanceLogger(perfMon));

    // Third-party middleware setup
    app.use(compression());
    app.use(cookieParser());
    app.use(bodyParser.json());

    // Helper function to log server initialization errors
    function HandleServerError(error: Error) {
      Logs.logCritical(error);
      Logs.logCritical("Error while initiliazing server.");
    }

    // Load config
    LoadConfigFromFile(options["config"]).then(async (config: Config) => {
      Logs.logInfo("Loaded config.");
      const services: Services = {
        config: config,
        dbManager: new DatabaseManager(config),
        storagePortal: new S3StoragePortal(config),
        scryfallManager: new ScryfallManager(),
        perfMon: perfMon,
      };

      // Handlers
      const imageHandler = ImagesHandler(services);
      app.use(ErrorHandler); // Trigger on unhandled errors
      app.use(SetupRequiredHandler(services));
      app.use(ViewHandler(services));
      app.use(WellKnownHandler(services));
      app.use("/CardBack.jpg", express.static("./static/CardBack.jpg"));
      for (const path of config.cardImageRoutes) {
        app.use(path, imageHandler);
      }
      app.use(NotFoundHandler); // Trigger on unrecognized path

      // Server options
      let serverOptions: https.ServerOptions = {};
      if (!config.nohttps) {
        Logs.logInfo(
          "SSL Key File Size: " + fs.statSync(config.sslOptions.keyFile).size
        );
        serverOptions = {
          key: fs.readFileSync(config.sslOptions.keyFile),
          cert: fs.readFileSync(config.sslOptions.certFile),
        };
      }

      // Initialize the database
      await services.dbManager.ensureDatabaseAndTablesExist(config);

      // Heartbeats and server status managment
      setServerName(serverLabel + ":" + os.hostname());
      initStatusManagement(services);

      const toCloseOnDie: http.Server[] = [];
      onDie = async () => {
        await logGracefulDeath(services);
        for (const dier of toCloseOnDie) {
          dier.close();
        }
      };

      // Listen for traffic
      if (config.nohttps) {
        // HTTP mode for ease of debugging
        toCloseOnDie.push(
          http
            .createServer(app)
            .listen(config.network.unsecurePort)
            .on("error", HandleServerError)
        );
        Logs.logCritical(
          "Started non-HTTPs server on port " +
            config.network.unsecurePort +
            "."
        );
        Logs.logCritical("==========================================");
        Logs.logCritical(
          "This mode is only recommended for development, and even then it is" +
            "strongly recommended that you setup HTTPS. The .XYZ domain is like $1/year, " +
            "grab one, get a certificate set up, and setup your HOSTS file to point your " +
            "subdomain to localhost."
        );
        Logs.logCritical("==========================================");
      } else {
        // HTTPS mode intended for production
        toCloseOnDie.push(
          https
            .createServer(serverOptions, app)
            .listen(config.network.securePort)
            .on("error", HandleServerError)
        );
        Logs.logInfo("Server listening on port " + config.network.securePort);

        const httpApp = express();
        httpApp.get("*", HTTPSRedirectionHandler);
        toCloseOnDie.push(
          http
            .createServer(httpApp)
            .listen(config.network.unsecurePort)
            .on("error", HandleServerError)
        );
      }
      perfStartup.Pop();
    });
  }
}

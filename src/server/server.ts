import express from "express";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
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

// Setup command line params
const options = commandLineArgs([
  {
    name: "config",
    alias: "c",
    type: String,
    defaultValue: "./example_config.json",
  },
  { name: "loglevel", alias: "l", type: Number, defaultValue: Logs.Level.INFO },
]);

// Initial some global stuff
Logs.setLogLevel(options["loglevel"]);

// Create the primary server
const app = express();

// View engine setup
app.set("views", "./views");
app.set("view engine", "ejs");

// Third-party middleware setup
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper function to log server initialization errors
function HandleServerError(error: Error) {
  Logs.logCritical(error);
  Logs.logCritical("Error while initiliazing server.");
}

// Load config
LoadConfigFromFile(options["config"]).then((config: Config) => {
  Logs.logInfo("Loaded config.");
  const services: Services = {
    config: config,
    storagePortal: new S3StoragePortal(config),
  };

  // Handlers
  app.use(ErrorHandler); // Trigger on unhandled errors
  app.use(SetupRequiredHandler(services));
  app.use(ViewHandler(services));
  app.use(NotFoundHandler); // Trigger on unrecognized path

  // Server options
  let serverOptions: https.ServerOptions = {};
  if (!config.nohttps) {
    serverOptions = {
      key: fs.readFileSync(config.sslOptions.keyFile),
      cert: fs.readFileSync(config.sslOptions.certFile),
    };
  }

  // Listen for traffic
  if (config.nohttps) {
    // HTTP mode for ease of debugging
    http
      .createServer(app)
      .listen(config.network.unsecurePort)
      .on("error", HandleServerError);
    Logs.logCritical(
      "Started non-HTTPs server on port " + config.network.unsecurePort + "."
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
    https
      .createServer(serverOptions, app)
      .listen(config.network.securePort)
      .on("error", HandleServerError);
    Logs.logInfo("Server listening on port " + config.network.securePort);

    const httpApp = express();
    httpApp.get("*", HTTPSRedirectionHandler);
    http
      .createServer(httpApp)
      .listen(config.network.unsecurePort)
      .on("error", HandleServerError);
  }
});

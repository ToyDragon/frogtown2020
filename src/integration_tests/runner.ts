import commandLineArgs from "command-line-args";
// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import LoadConfigFromFile from "../server/services/config/config_loader";
import { Level, setLogLevel } from "../server/log";
import { IntegrationTest, RunParams } from "./integration_test";
import CardsearchLoadsTest from "./tests/cardsearch_loads_test";
import SettingsCardbackTest from "./tests/settings_cardback_test";
import SettingsChangeUsernameTest from "./tests/settings_change_username_test";
import SettingsChangeUserTest from "./tests/settings_change_user_test";
import SettingsQualityTest from "./tests/settings_quality_test";

interface CommandLineArgs {
  server: string;
  port: number;
  config: string;
}

function getCommandLineArgs(): CommandLineArgs {
  const options = commandLineArgs([
    {
      // The URL for the server we are testing against, for example "kismarton.frogtown.me".
      name: "server",
      alias: "s",
      type: String,
      defaultValue: "",
    },
    {
      // The HTTPS port for the server, such as "443".
      name: "port",
      alias: "p",
      type: Number,
      defaultValue: -1,
    },
    {
      // The file containing the config used by the server.
      name: "config",
      alias: "c",
      type: String,
      defaultValue: "./config.json",
    },
  ]);

  const serverUrl: string | null = options["server"];
  if (!serverUrl) {
    throw new Error("Server URL required.");
  }

  const port: number | null = options["port"];
  if (!port) {
    throw new Error("Server port required.");
  }

  return {
    server: serverUrl,
    port: port,
    config: options["config"],
  };
}

(async () => {
  const args = getCommandLineArgs();
  const config = await LoadConfigFromFile(args.config);

  // Construct an object with the parameters required to run a test.
  const runParams: RunParams = {
    authCookies: [
      {
        // This user has nothing special about them, we just need a user to test with.
        domain: args.server,
        value: "4rsvvuw12bm4o1p7bo81bvbp",
        name: "publicId",
      },
      {
        domain: args.server,
        value:
          "u0bsducmqxljditro9tqcn0syvutr2960ia1uk3ivpzezkljcxudnifox0rie7nh",
        name: "privateId",
      },
    ],
    browser: await puppeteer.launch(),
    serverUrl: args.server,
    port: args.port,
    config: config,
  };

  // Disable logging in the integration tests. All logging done for tests should directly use console.log
  setLogLevel(Level.NONE);

  // Integration tests run in parallel, in serial batches. If your test has no dependencies or side effects
  // you can add it to the bottom list. If your test risks impacting other tests, it needs to go in a separate
  // array from those it impacts.
  const testSets: IntegrationTest[][] = [
    [
      // This changes cookies, so it needs to be done before all other tests that make requests.
      new SettingsChangeUserTest(),
    ],
    [
      new CardsearchLoadsTest(),
      new SettingsChangeUsernameTest(),
      new SettingsCardbackTest(),
      new SettingsQualityTest(),
    ],
  ];
  let failed = false;
  for (const set of testSets) {
    // Loop over all tests that should run in parallel, and put their promises in the promise array.
    const testRunPromises: Promise<void>[] = [];
    for (const test of set) {
      testRunPromises.push(
        (async () => {
          try {
            await test.run(runParams);
            console.log(`Test ${test.name()} passed!`);
          } catch (e) {
            console.log(`Test ${test.name()} failed!`);
            console.error(e);
            failed = true;
          }
        })()
      );
    }
    // Wait for all tests in this batch to complete before moving on to the next batch.
    await Promise.all(testRunPromises);
  }

  // Now that the tests are done, clean up the browser.
  await runParams.browser.close();

  if (failed) {
    console.error("Integration tests failed.");
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  } else {
    console.log("All tests passed.");
  }
})();

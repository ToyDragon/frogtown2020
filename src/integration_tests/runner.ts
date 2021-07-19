import commandLineArgs from "command-line-args";
// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import LoadConfigFromFile from "../server/services/config/config_loader";
import { Level, setLogLevel } from "../server/log";
import { IntegrationTest, saveScreenshot } from "./integration_test";
import CardsearchLoadsTest from "./tests/cardsearch_loads_test";
import SettingsCardbackTest from "./tests/settings_cardback_test";
import SettingsChangeUsernameTest from "./tests/settings_change_username_test";
import SettingsChangeUserTest from "./tests/settings_change_user_test";
import SettingsQualityTest from "./tests/settings_quality_test";
import CreateAndDeleteDeckTest from "./tests/create_and_delete_deck_test";
import DeckEditorImportDisplayAndGroupTest from "./tests/deck_editor_import_display_and_group_test";

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
      defaultValue: 0,
    },
    {
      // The file containing the config used by the server.
      name: "config",
      alias: "c",
      type: String,
      defaultValue: "./config.json",
    },
  ]);

  return {
    server: options["server"],
    port: options["port"],
    config: options["config"],
  };
}

(async () => {
  const args = getCommandLineArgs();
  const config = await LoadConfigFromFile(args.config);
  if (!args.port) {
    args.port = config.network.securePort;
  }
  if (!args.server) {
    args.server = config.hostname;
  }
  const browser = await puppeteer.launch();

  // Construct an object with the parameters required to run a test.
  const runParams = {
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
      // This ensures decks can be deleted, which is important for all the new decks other tests will make.
      new CreateAndDeleteDeckTest(),
    ],
    [
      new CardsearchLoadsTest(),
      new SettingsChangeUsernameTest(),
      new SettingsCardbackTest(),
      new SettingsQualityTest(),
      new DeckEditorImportDisplayAndGroupTest(),
    ],
  ];
  let failed = false;
  for (const set of testSets) {
    // Loop over all tests that should run in parallel, and put their promises in the promise array.
    const testRunPromises: Promise<void>[] = [];
    for (const test of set) {
      testRunPromises.push(
        (async () => {
          const pages: puppeteer.Page[] = [];
          for (let attempt = 0; attempt < 5; ++attempt) {
            try {
              await test.run({
                ...runParams,
                newPage: async () => {
                  const page = await browser.newPage();
                  await page.setViewport({
                    width: 1920,
                    height: 1080,
                  });
                  await page.setCookie(...runParams.authCookies);
                  pages.push(page);
                  return page;
                },
              });
              console.log(`Test ${test.name()} passed!`);
              break;
            } catch (e) {
              let pageScreenshots: string[] = [];
              for (let i = 0; i < pages.length; ++i) {
                if (!pages[i].isClosed()) {
                  pageScreenshots.push(
                    await saveScreenshot(pages[i], test.name() + "_page_" + i)
                  );
                  await pages[i].close();
                }
              }
              let screenshotMessage = "";
              if (pageScreenshots.length > 0) {
                screenshotMessage =
                  "Saved screenshots of pages: " +
                  pageScreenshots.join(", ") +
                  ".";
                pageScreenshots = [];
              }
              const errs = [
                `Test ${test.name()} failed attempt ${attempt + 1}!\n`,
                `  ${screenshotMessage}\n`,
              ];
              if (attempt < 4) {
                errs.push(`  ${(e as Error).message}`);
              } else {
                errs.push(e);
                failed = true;
              }
              console.error(...errs);
            }
          }
        })()
      );
    }
    // Wait for all tests in this batch to complete before moving on to the next batch.
    await Promise.all(testRunPromises);
  }

  // Now that the tests are done, clean up the browser.
  await browser.close();

  if (failed) {
    console.error("Integration tests failed.");
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  } else {
    console.log("All tests passed.");
  }
})();

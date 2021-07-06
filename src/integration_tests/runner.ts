import commandLineArgs from "command-line-args";
// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import LoadConfigFromFile from "../server/config_loader";
import { IntegrationTest, RunParams } from "./integration_test";
import CardsearchLoadsTest from "./tests/cardsearch_loads_test";
import SettingsQualityTest from "./tests/settings_quality_test";
import SettingsChangeUsernameTest from "./tests/settings_change_username_test";
import SettingsCardbackTest from "./tests/settings_cardback_test";
import SettingsChangeUserTest from "./tests/settings_change_user_test";

(async () => {
  // Setup command line params
  const options = commandLineArgs([
    {
      name: "server",
      alias: "s",
      type: String,
      defaultValue: "",
    },
    {
      name: "port",
      alias: "p",
      type: Number,
      defaultValue: -1,
    },
    {
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
  const config = await LoadConfigFromFile(options["config"]);
  const browser = await puppeteer.launch();
  const runParams: RunParams = {
    authCookies: [
      {
        domain: serverUrl,
        value: "4rsvvuw12bm4o1p7bo81bvbp",
        name: "publicId",
      },
      {
        domain: serverUrl,
        value:
          "u0bsducmqxljditro9tqcn0syvutr2960ia1uk3ivpzezkljcxudnifox0rie7nh",
        name: "privateId",
      },
    ],
    browser: browser,
    serverUrl: serverUrl,
    port: port,
    config: config,
  };

  let failed = false;
  const testSets: IntegrationTest[][] = [
    [new SettingsChangeUserTest()],
    [
      new CardsearchLoadsTest(),
      new SettingsChangeUsernameTest(),
      new SettingsCardbackTest(),
      new SettingsQualityTest(),
    ],
  ];
  for (const set of testSets) {
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
    await Promise.all(testRunPromises);
  }
  await browser.close();

  if (failed) {
    console.error("Integration tests failed.");
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  } else {
    console.log("All tests passed.");
  }
})();

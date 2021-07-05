import commandLineArgs from "command-line-args";
// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import { IntegrationTest, RunParams } from "./integration_test";
import CardsearchLoadsTest from "./tests/cardsearch_loads_test";
import SettingsChangeUsernameTest from "./tests/settings_change_username_test";

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
  ]);

  const serverUrl: string | null = options["server"];
  if (!serverUrl) {
    throw new Error("Server URL required.");
  }
  const port: number | null = options["port"];
  if (!port) {
    throw new Error("Server port required.");
  }
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
  };
  let failed = false;
  const tests: IntegrationTest[] = [
    new CardsearchLoadsTest(),
    new SettingsChangeUsernameTest(),
  ];
  for (const test of tests) {
    process.stdout.write("Running test " + test.name() + "... ");
    try {
      await test.run(runParams);
      process.stdout.write("Passed!\n");
    } catch (e) {
      process.stdout.write("Failed!\n");
      console.error(e);
      failed = true;
    }
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

import commandLineArgs from "command-line-args";
// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";

(async () => {
  console.log("Running.");

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
  const page = await browser.newPage();
  page.setCookie({
    domain: serverUrl,
    value: "4rsvvuw12bm4o1p7bo81bvbp",
    name: "publicId",
    path: "/",
  });
  page.setCookie({
    domain: serverUrl,
    value: "u0bsducmqxljditro9tqcn0syvutr2960ia1uk3ivpzezkljcxudnifox0rie7nh",
    name: "privateId",
    path: "/",
  });

  page.on("error", (e) => {
    console.error(e);
  });
  page.on("console", (e) => {
    console.log(e.text());
  });
  await page.goto(`https://${serverUrl}:${port}/cardsearch.html`);
  await page.mainFrame().waitForTimeout(100);
  await page.mainFrame().click(".btn-mydecks");
  const includedData: { decks: unknown[] } = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).includedData;
  });
  const cookies: string = await page.evaluate(() => {
    return document.cookie;
  });
  console.log(
    `Loaded ${includedData.decks.length} decks. ${JSON.stringify(includedData)}`
  );
  console.log(`Cookies: ${cookies}`);
  await browser.close();
})();

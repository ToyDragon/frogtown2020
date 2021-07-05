import { timeout } from "../../shared/utils";
import { IntegrationTest, RunParams } from "../integration_test";

export default class SettingsChangeUsernameTest extends IntegrationTest {
  name(): string {
    return "SettingsChangeUsernameTest";
  }

  async run(params: RunParams): Promise<boolean> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    const testName = "Kanye West " + Math.trunc(Math.random() * 100000);

    // Verify that the checkmark is visible.
    let okClass = await page.$eval<string>(
      "#inputName + .refresh + .ok",
      (e) => e.className
    );
    if (!okClass) {
      console.log("No checkmark icon element.");
      return false;
    }
    if (okClass.indexOf("nodisp") >= 0) {
      console.log("Checkmark hidden initially.");
      return false;
    }

    // Change the name in the input.
    await page.type("#inputName", testName, {
      delay: 25,
    });
    // Force the input to have the correct value, because puppeteer can't type correctly.
    // We still need to call page.type to trigger the keyboard events.
    await page.evaluate((testName) => {
      (document.querySelector(
        "#inputName"
      ) as HTMLInputElement).value = testName;
    }, testName);

    // Verify that the checkmark has disappeared while the change is pending.
    okClass = await page.$eval<string>(
      "#inputName + .refresh + .ok",
      (e) => e.className
    );
    if (!okClass) {
      console.log("No checkmark icon element.");
      return false;
    }
    if (okClass.indexOf("nodisp") === -1) {
      console.log("Checkmark not hidden while change pending.");
      return false;
    }

    // Verify that the checkmark is back after some time.
    await timeout(1500);
    okClass = await page.$eval<string>(
      "#inputName + .refresh + .ok",
      (e) => e.className
    );
    if (!okClass) {
      console.log("No checkmark icon element.");
      return false;
    }
    if (okClass.indexOf("nodisp") >= 0) {
      console.log("Checkmark hidden after change should have submitted.");
      return false;
    }

    // Verify that the name change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(250);
    const inputValue = await page.$eval<string>(
      "#inputName",
      (e) => (e as HTMLInputElement).value
    );
    if (!inputValue) {
      console.log("No name input element.");
      return false;
    }
    if (inputValue !== testName) {
      console.log("Name input doesn't have test name after reload.");
      return false;
    }

    return true;
  }
}

import { timeout } from "../../shared/utils";
import {
  assertValueSatisfies,
  IntegrationTest,
  RunParams,
} from "../integration_test";

export default class SettingsChangeUsernameTest extends IntegrationTest {
  name(): string {
    return "SettingsChangeUsernameTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    const testName = "Kanye West " + Math.trunc(Math.random() * 100000);

    // Verify that the checkmark is visible.
    await assertValueSatisfies(
      page,
      "#inputName + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") === -1
    );

    // Change the name in the input.
    // page.type is required to trigger the keyboard events, but it consistently types the wrong text. Maybe a bug with puppeteer?
    // We get around that by forcing the input to have the correct value after a waiting period.
    await page.type("#inputName", testName, {
      delay: 25,
    });
    await timeout(75);
    await page.evaluate((testName) => {
      (document.querySelector(
        "#inputName"
      ) as HTMLInputElement).value = testName;
    }, testName);

    // Verify that the checkmark has disappeared while the change is pending.
    await assertValueSatisfies(
      page,
      "#inputName + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") >= 0
    );

    // Verify that the checkmark is back after some time.
    await timeout(1500);
    await assertValueSatisfies(
      page,
      "#inputName + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") === -1
    );

    // Verify that the name change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1500);
    await assertValueSatisfies(
      page,
      "#inputName",
      "value",
      (value: string) => value === testName
    );
  }
}

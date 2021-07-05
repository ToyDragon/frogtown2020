import { timeout } from "../../shared/utils";
import {
  assertValueSatisfies,
  IntegrationTest,
  RunParams,
  type,
} from "../integration_test";

export default class SettingsCardbackTest extends IntegrationTest {
  name(): string {
    return "SettingsCardbackTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    const version = Math.trunc(Math.random() * 100000);
    const testUrl = `https://${params.serverUrl}:${params.port}/Images/V${version}/CardBack.jpg`;

    // Verify that the checkmark is visible.
    await assertValueSatisfies(
      page,
      "#ttsBackInput + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") === -1
    );

    // Change the url in the input.
    await type(page, "#ttsBackInput", testUrl);

    // Verify that the checkmark has disappeared while the change is pending.
    await assertValueSatisfies(
      page,
      "#ttsBackInput + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") >= 0
    );

    // Verify that the checkmark is back after some time.
    await timeout(1500);
    await assertValueSatisfies(
      page,
      "#ttsBackInput + .refresh + .ok",
      "className",
      (className: string) => className.indexOf("nodisp") === -1
    );

    // Verify that the url change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1500);
    await assertValueSatisfies(
      page,
      "#ttsBackInput",
      "value",
      (value: string) => value === testUrl
    );
  }
}

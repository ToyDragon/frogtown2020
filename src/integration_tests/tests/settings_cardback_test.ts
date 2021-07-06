import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import { IntegrationTest, RunParams, type } from "../integration_test";

// This test validates that the user's cardback URL can be changed.
// It does not validate whether or not the cardback URL is included in exported decks.
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
    await Assert.visible(page, "#ttsBackInput + .refresh + .ok");

    // Change the url in the input.
    await type(page, "#ttsBackInput", testUrl);

    // Verify that the checkmark has disappeared while the change is pending.
    await Assert.notVisible(page, "#ttsBackInput + .refresh + .ok");

    // Verify that the checkmark is back after some time.
    await timeout(1500);
    await Assert.visible(page, "#ttsBackInput + .refresh + .ok");

    // Verify that the url change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1500);
    await Assert.valueSatisfies(
      page,
      "#ttsBackInput",
      "value",
      (value: string) => value === testUrl
    );
  }
}

import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import { IntegrationTest, RunParams, type } from "../integration_test";

// This test validates that the user can change their name.
// It does not test any appearences of the username on any other page.
export default class SettingsChangeUsernameTest extends IntegrationTest {
  name(): string {
    return "SettingsChangeUsernameTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    const testName = "Kanye West " + Math.trunc(Math.random() * 100000);

    // Verify that the checkmark is visible, and the refresh icon hidden.
    await Assert.visible(page, "#inputName + .refresh + .ok");
    await Assert.notVisible(page, "#inputName + .refresh");

    // Change the name in the input.
    await type(page, "#inputName", testName);

    // Verify that the checkmark has disappeared while the change is pending.
    await Assert.notVisible(page, "#inputName + .refresh + .ok");
    await Assert.visible(page, "#inputName + .refresh");

    // Verify that the checkmark is back after some time.
    await timeout(1500);
    await Assert.visible(page, "#inputName + .refresh + .ok");
    await Assert.notVisible(page, "#inputName + .refresh");

    // Verify that the name change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1500);
    await Assert.valueSatisfies(
      page,
      "#inputName",
      "value",
      (value: string) => value === testName
    );
  }
}

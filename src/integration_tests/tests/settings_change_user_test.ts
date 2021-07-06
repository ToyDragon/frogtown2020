import { timeout } from "../../shared/utils";
import {
  assertNotVisible,
  assertValueSatisfies,
  assertVisible,
  IntegrationTest,
  RunParams,
  type,
} from "../integration_test";

// This test validates that the user can change which ID they are using.
export default class SettingsChangeUserTest extends IntegrationTest {
  name(): string {
    return "SettingsChangeUserTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    await page.waitForTimeout(100);
    const oldId =
      "u0bsducmqxljditro9tqcn0syvutr2960ia1uk3ivpzezkljcxudnifox0rie7nh";
    const newId =
      "xhjaz9nlcdeij0x3ghudok2zh4i575r66e6cavevh25fm4xt53jvugmn2k0umihz";

    // Verify the input is initially hidden.
    await assertNotVisible(page, "#divPrivateId");

    // Click the button to reveal the input.
    await page.click("#btnChangePrivateId", {
      delay: 200,
    });

    // Verify the input is now visible.
    await assertVisible(page, "#divPrivateId");

    // Verify that the checkmark is visible.
    await assertVisible(page, "#inputId + .error + .refresh + .ok");

    // Verify that the input shows the current ID.
    await assertValueSatisfies(
      page,
      "#inputId",
      "value",
      (value: string) => value === oldId
    );

    try {
      // Change the private ID.
      await type(page, "#inputId", newId);

      // Verify that the checkmark has disappeared while the change is pending.
      await assertNotVisible(page, "#inputId + .error + .refresh + .ok");

      // Verify that the checkmark is back after some time.
      await timeout(1500);
      await assertVisible(page, "#inputId + .error + .refresh + .ok");

      // Verify that the ID change persists after reloading the page.
      await page.reload();
      await page.waitForTimeout(1500);
      await assertValueSatisfies(
        page,
        "#inputId",
        "value",
        (value: string) => value === newId
      );
    } finally {
      // Restore the original ID.
      await type(page, "#inputId", oldId);
      await page.waitForTimeout(1500);
    }
  }
}

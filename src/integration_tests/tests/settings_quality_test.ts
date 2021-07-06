import { timeout } from "../../shared/utils";
import {
  IntegrationTest,
  RunParams,
  verifyExistsAndGetValue,
} from "../integration_test";
import * as https from "https";

// This test validates that the user can change their preferred quality, and that images redirect based on the setting correctly.
export default class SettingsQualityTest extends IntegrationTest {
  name(): string {
    return "SettingsQualityTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    await timeout(1000);
    const cardUrl = `https://${params.serverUrl}:${params.port}/Images/V1/6cd72b77-f505-4023-a72d-b9f05b80080c.jpg`;

    // Check current quality setting.
    let qualityTextContent = await verifyExistsAndGetValue(
      page,
      "#spanCurrentQualityDisplay",
      "textContent"
    );
    const initialHQ = qualityTextContent.toLowerCase().indexOf("low") === -1;

    // Verify that cards redirect to the correct bucket.
    let expectedBucket = initialHQ
      ? params.config.storage.awsS3HighQualityImageBucket
      : params.config.storage.awsS3CompressedImageBucket;
    let redirectUrl: string = await new Promise((resolve) => {
      https.get(cardUrl, (msg) => {
        resolve(msg.headers.location || "");
      });
    });
    if (redirectUrl.indexOf(expectedBucket) === -1) {
      throw new Error(
        `Expected redirect url "${redirectUrl}" for ${
          initialHQ ? "HQ" : "LQ"
        } quality bucket to contain "${expectedBucket}", before changing.`
      );
    }

    // Change the quality.
    await page.click("#btnToggleHQ");

    // TODO: Test that the old setting is still cached.

    // There is cache for image quality, so wait for it to expire.
    await timeout((params.config.imageQualityCacheDuration + 1) * 1000);

    // Verify quality display changed.
    qualityTextContent = await verifyExistsAndGetValue(
      page,
      "#spanCurrentQualityDisplay",
      "textContent"
    );
    const newHQ = qualityTextContent.toLowerCase().indexOf("low") === -1;
    if (newHQ === initialHQ) {
      throw new Error("Expected clicking quality button to change quality.");
    }

    // Verify that cards redirect to the correct bucket.
    expectedBucket = newHQ
      ? params.config.storage.awsS3HighQualityImageBucket
      : params.config.storage.awsS3CompressedImageBucket;
    redirectUrl = await new Promise((resolve) => {
      https.get(cardUrl, (msg) => {
        resolve(msg.headers.location || "");
      });
    });
    if (redirectUrl.indexOf(expectedBucket) === -1) {
      throw new Error(
        `Expected redirect url "${redirectUrl}" for ${
          newHQ ? "HQ" : "LQ"
        } quality bucket to contain "${expectedBucket}", after changing.`
      );
    }

    // Verify that the setting change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1000);
    qualityTextContent = await verifyExistsAndGetValue(
      page,
      "#spanCurrentQualityDisplay",
      "textContent"
    );
    const reloadHQ = qualityTextContent.toLowerCase().indexOf("low") === -1;
    if (reloadHQ !== newHQ) {
      throw new Error("Quality change didn't persist after reloading page.");
    }

    // Wait for the cache to expire again, so this doesn't impact future tests.
    await timeout((params.config.imageQualityCacheDuration + 1) * 1000);
  }
}

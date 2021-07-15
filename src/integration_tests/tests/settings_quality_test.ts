// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import { timeout } from "../../shared/utils";
import { IntegrationTest, RunParams } from "../integration_test";
import * as https from "https";
import Config from "../../server/services/config/config";
import Assert from "../assertions";

// This test validates that the user can change their preferred quality, and that images redirect based on the setting correctly.
export default class SettingsQualityTest extends IntegrationTest {
  name(): string {
    return "SettingsQualityTest";
  }

  getRedirectUrl(cardUrl: string): Promise<string> {
    return new Promise((resolve) => {
      https.get(cardUrl, (msg) => {
        resolve(msg.headers.location || "");
      });
    });
  }

  getBucket(isHQ: boolean, config: Config): string {
    return isHQ
      ? config.storage.awsS3HighQualityImageBucket
      : config.storage.awsS3CompressedImageBucket;
  }

  async getShownQuality(page: puppeteer.Page): Promise<boolean> {
    const qualityTextContent = await Assert.existsAndGetValue(
      page,
      "#spanCurrentQualityDisplay",
      "textContent"
    );
    return qualityTextContent.toLowerCase().indexOf("low") === -1;
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(`https://${params.serverUrl}:${params.port}/settings.html`);
    await timeout(1000);
    const cardUrl = `https://${params.serverUrl}:${params.port}/Images/V1/6cd72b77-f505-4023-a72d-b9f05b80080c.jpg`;

    // Check current quality setting.
    const initialHQ = await this.getShownQuality(page);

    // Verify that cards redirect to the correct bucket.
    let redirectUrl = await this.getRedirectUrl(cardUrl);
    let expectedBucket = this.getBucket(initialHQ, params.config);
    await Assert.contains(redirectUrl, expectedBucket);

    // Change the quality.
    await page.click("#btnToggleHQ");

    // TODO: Test that the old setting is still cached.

    // There is cache for image quality, so wait for it to expire.
    await timeout((params.config.imageQualityCacheDuration + 1) * 1000);

    // Verify quality display changed.
    const newHQ = await this.getShownQuality(page);
    await Assert.notEquals(newHQ, initialHQ);

    // Verify that cards redirect to the correct bucket.
    expectedBucket = this.getBucket(newHQ, params.config);
    redirectUrl = await this.getRedirectUrl(cardUrl);
    await Assert.contains(redirectUrl, expectedBucket);

    // Verify that the setting change persists after reloading the page.
    await page.reload();
    await page.waitForTimeout(1000);
    const reloadHQ = await this.getShownQuality(page);
    await Assert.equals(newHQ, reloadHQ);

    // Wait for the cache to expire again, so this doesn't impact future tests.
    await timeout((params.config.imageQualityCacheDuration + 1) * 1000);
  }
}

// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Config from "../server/services/config/config";
import { timeout } from "../shared/utils";

export async function saveScreenshot(
  page: puppeteer.Page,
  selector: string
): Promise<string> {
  const path = `./static/icons/screenshot_${selector.replace(
    /[^a-zA-Z0-9_]/g,
    ""
  )}.png`;
  await page.screenshot({ path: path });
  return path;
}

// Type some text into a text input. This is a wrapper around page.type that fixes an issue.
export async function type(
  page: puppeteer.Page,
  selector: string,
  value: string
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)!.scrollIntoView();
    }, selector);
    await page.waitForSelector(selector, { visible: true, timeout: 1000 });
    // page.type is required to trigger the keyboard events, but it consistently types the wrong text. Maybe a bug with puppeteer?
    // We get around that by forcing the input to have the correct value after a waiting period.
    await page.type(selector, value, {
      delay: 25,
    });
    await timeout(75);
    await page.evaluate(
      (value, selector: string) => {
        (document.querySelector(selector) as HTMLInputElement).value = value;
      },
      value,
      selector
    );
  } catch (e) {
    e.message = `Unable to type into "${selector}". ${
      e.message
    }. Saved screenshot ${await saveScreenshot(page, selector)}.`;
    throw e;
  }
}

export async function clickUntil(
  page: puppeteer.Page,
  selector: string,
  condition: () => Promise<boolean>
): Promise<void> {
  if (await condition()) {
    return;
  }
  for (let i = 0; i < 100; ++i) {
    await click(page, selector);
    for (let j = 0; j < 10; ++j) {
      if (await condition()) {
        return;
      }
      await timeout(100);
    }
  }
  throw new Error(
    `Failed to meet condition after repeatedly clicking ${selector}.`
  );
}

// This is a wrapper around page.click that includes the selector in the error message.
export async function click(
  page: puppeteer.Page,
  selector: string
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)!.scrollIntoView();
    }, selector);
    await page.waitForSelector(selector, { visible: true, timeout: 1000 });
    await page.click(selector);
  } catch (e) {
    e.message = `Unable to click "${selector}". ${
      e.message
    }. Saved screenshot ${await saveScreenshot(page, selector)}.`;
    throw e;
  }
}

export interface RunParams {
  newPage: () => Promise<puppeteer.Page>;
  authCookies: puppeteer.Protocol.Network.CookieParam[];
  serverUrl: string;
  port: number;
  config: Config;
}

export abstract class IntegrationTest {
  abstract name(): string;
  abstract run(params: RunParams): Promise<void>;
}

// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Config from "../server/services/config/config";
import { timeout } from "../shared/utils";

// Type some text into a text input. This is a wrapper around page.type that fixes an issue.
export async function type(
  page: puppeteer.Page,
  selector: string,
  value: string
): Promise<void> {
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
}

// This is a wrapper around page.click that includes the selector in the error message.
export async function click(
  page: puppeteer.Page,
  selector: string
): Promise<void> {
  try {
    await page.click(selector);
  } catch (e) {
    e.message = `Unable to click "${selector}". ${e.message}`;
    throw e;
  }
}

export interface RunParams {
  browser: puppeteer.Browser;
  authCookies: puppeteer.Protocol.Network.CookieParam[];
  serverUrl: string;
  port: number;
  config: Config;
}

export abstract class IntegrationTest {
  abstract name(): string;
  abstract run(params: RunParams): Promise<void>;
}

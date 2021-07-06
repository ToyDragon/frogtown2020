// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Config from "../server/config";
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

// Gets a property of an HTMLElement object, throwing an error if the selector doesn't select an element.
// Notably this doesn't get things requiring function calls, such as `element.getAttribute("href")`.
export async function verifyExistsAndGetValue(
  page: puppeteer.Page,
  selector: string,
  property: string
): Promise<string> {
  try {
    return await page.$eval<string>(
      selector,
      (e, property) =>
        ((e as unknown) as Record<string, string>)[property as string],
      property
    );
  } catch (e) {
    // The default error is very generic, so throw an error with more meaningful debug info.
    console.error(e);
    throw new Error(
      `Unable to find element "${selector}" while trying to get property "${property}".`
    );
  }
}

// Wrapper around verifyExistsAndGetValue that checks the result with a condition function.
// The condition function should take just the property as input, and return true on success, or false on failure.
export async function assertValueSatisfies(
  page: puppeteer.Page,
  selector: string,
  property: string,
  condition: (val: string) => boolean
): Promise<string> {
  const actualValue = await verifyExistsAndGetValue(page, selector, property);
  if (!condition(actualValue)) {
    throw new Error(
      `Element with selector "${selector}" with value "${actualValue}" did not satisfy condition "${condition}".`
    );
  }
  return actualValue;
}

// Wrapper around page.waitForSelector with specific default values.
export async function assertVisible(
  page: puppeteer.Page,
  selector: string
): Promise<void> {
  await page.waitForSelector(selector, {
    visible: true,
    timeout: 250,
  });
}

// Wrapper around page.waitForSelector with specific default values.
export async function assertNotVisible(
  page: puppeteer.Page,
  selector: string
): Promise<void> {
  await page.waitForSelector(selector, {
    hidden: true,
    timeout: 250,
  });
}

// Wrapper around indexOf that throws an error.
export function assertContains(value: string, substring: string): void {
  if (value.indexOf(substring) === -1) {
    throw new Error(`Expected value "${value}" to contain "${substring}".`);
  }
}

// Wrapper around indexOf that throws an error.
export function assertDoesntContain(value: string, substring: string): void {
  if (value.indexOf(substring) >= 0) {
    throw new Error(`Expected value "${value}" to not contain "${substring}".`);
  }
}

// Wrapper around === that throws an error.
export function assertEquals<T>(a: T, b: T): void {
  if (a !== b) {
    throw new Error(`Expected value "${a}" to equal "${b}".`);
  }
}

// Wrapper around === that throws an error.
export function assertNotEquals<T>(a: T, b: T): void {
  if (a === b) {
    throw new Error(`Expected value "${a}" not to equal "${b}".`);
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

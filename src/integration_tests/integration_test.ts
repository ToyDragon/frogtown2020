// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";

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
    // Throw an error with more meaningful debug info.
    console.error(e);
    throw new Error(
      `Unable to find element "${selector}" while trying to get property "${property}".`
    );
  }
}

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

export interface RunParams {
  browser: puppeteer.Browser;
  authCookies: puppeteer.Protocol.Network.CookieParam[];
  serverUrl: string;
  port: number;
}

export abstract class IntegrationTest {
  abstract name(): string;
  abstract run(params: RunParams): Promise<void>;
}

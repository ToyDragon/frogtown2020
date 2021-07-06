// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";

export default abstract class Assert {
  // Gets a property of an HTMLElement object, throwing an error if the selector doesn't select an element.
  // Notably this doesn't get things requiring function calls, such as `element.getAttribute("href")`.
  public static async existsAndGetValue(
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
      throw new Error(
        `Unable to find element "${selector}" while trying to get property "${property}".`
      );
    }
  }

  // Wrapper around verifyExistsAndGetValue that checks the result with a condition function.
  // The condition function should take just the property as input, and return true on success, or false on failure.
  public static async valueSatisfies(
    page: puppeteer.Page,
    selector: string,
    property: string,
    condition: (val: string) => boolean
  ): Promise<string> {
    const actualValue = await Assert.existsAndGetValue(
      page,
      selector,
      property
    );
    if (!condition(actualValue)) {
      throw new Error(
        `Element with selector "${selector}" with value "${actualValue}" did not satisfy condition "${condition}".`
      );
    }
    return actualValue;
  }

  // Wrapper around page.waitForSelector with specific default values.
  public static async visible(
    page: puppeteer.Page,
    selector: string
  ): Promise<void> {
    await page.waitForSelector(selector, {
      visible: true,
      timeout: 250,
    });
  }

  // Wrapper around page.waitForSelector with specific default values.
  public static async notVisible(
    page: puppeteer.Page,
    selector: string
  ): Promise<void> {
    await page.waitForSelector(selector, {
      hidden: true,
      timeout: 250,
    });
  }

  // Wrapper around indexOf that throws an error.
  public static async contains(
    value: string,
    substring: string
  ): Promise<void> {
    if (value.indexOf(substring) === -1) {
      throw new Error(`Expected value "${value}" to contain "${substring}".`);
    }
  }

  // Wrapper around indexOf that throws an error.
  public static async doesntContain(
    value: string,
    substring: string
  ): Promise<void> {
    if (value.indexOf(substring) >= 0) {
      throw new Error(
        `Expected value "${value}" to not contain "${substring}".`
      );
    }
  }

  // Wrapper around === that throws an error.
  public static async equals<T>(a: T, b: T): Promise<void> {
    if (a !== b) {
      throw new Error(`Expected value "${a}" to equal "${b}".`);
    }
  }

  // Wrapper around === that throws an error.
  public static async notEquals<T>(a: T, b: T): Promise<void> {
    if (a === b) {
      throw new Error(`Expected value "${a}" not to equal "${b}".`);
    }
  }
}

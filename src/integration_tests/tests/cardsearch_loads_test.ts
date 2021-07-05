import { IntegrationTest, RunParams } from "../integration_test";

export default class CardsearchLoadsTest extends IntegrationTest {
  name(): string {
    return "CardsearchLoadsTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setCookie(...params.authCookies);
    await page.goto(
      `https://${params.serverUrl}:${params.port}/cardsearch.html`
    );
    const includedData: unknown | null = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).includedData;
    });
    if (!includedData) {
      throw new Error("No includedData on cardsearch.html");
    }
  }
}

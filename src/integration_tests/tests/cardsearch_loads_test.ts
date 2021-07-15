import { IntegrationTest, RunParams } from "../integration_test";

// This test only validates that the cardsearch page is accessible from the client, and that the ejs renders without errors.
// It does not validate any cardsearch behavior.
export default class CardsearchLoadsTest extends IntegrationTest {
  name(): string {
    return "CardsearchLoadsTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.newPage();
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

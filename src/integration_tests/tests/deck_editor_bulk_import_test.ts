import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import { click, IntegrationTest, RunParams, type } from "../integration_test";

// This tests that the bulk import action adds some cards to the mainboard.
export default class DeckEditorBulkImportTest extends IntegrationTest {
  name(): string {
    return "DeckEditorBulkImportTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.setCookie(...params.authCookies);
    await page.goto(
      `https://${params.serverUrl}:${params.port}/cardsearch.html`
    );
    await timeout(100);

    // Create a new deck.
    await click(page, "#tb_mydecks");
    await click(page, ".tbDeck[data-deckid='']");
    await page.waitForNavigation();
    await timeout(100);
    Assert.contains(page.url(), "/deckViewer/");

    // Open bulk import.
    await click(page, "#DeckActions");
    await click(page, "#actionBulkImport");
    await type(
      page,
      "#bulkInputArea",
      "3 10544646-50d5-4225-a35f-e8396850fc0b\n2 00030770-5e99-4943-819d-8d807c24cc14\n"
    );
    await timeout(100);
    await click(page, "#btnConfirmImport");
    await timeout(1000);

    // Verify the cards are present.
    Assert.equals(
      await page.evaluate(() => {
        return document.querySelectorAll(
          "div[data-id='10544646-50d5-4225-a35f-e8396850fc0b']"
        ).length;
      }),
      3
    );
    Assert.equals(
      await page.evaluate(() => {
        return document.querySelectorAll(
          "div[data-id='00030770-5e99-4943-819d-8d807c24cc14']"
        ).length;
      }),
      2
    );

    // Delete the deck.
    await click(page, "#DeckActions");
    await click(page, "#actionDelete");
    await click(page, "#btnConfirmDelete");
    await page.waitForNavigation();
    Assert.contains(page.url(), "/cardsearch");
  }
}

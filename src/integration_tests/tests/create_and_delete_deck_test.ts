import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import { click, IntegrationTest, RunParams } from "../integration_test";

// This tests that the button in the toolbar can be used to create a new deck, and that the deck can be deleted with a deck action.
export default class CreateAndDeleteDeckTest extends IntegrationTest {
  name(): string {
    return "CreateAndDeleteDeckTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1920,
    });
    await page.setCookie(...params.authCookies);
    await page.goto(
      `https://${params.serverUrl}:${params.port}/cardsearch.html`
    );
    await timeout(100);
    await click(page, "#tb_mydecks");
    await page.waitForSelector(".tbDeck[data-deckid='']", { visible: true });
    await click(page, ".tbDeck[data-deckid='']");
    await page.waitForNavigation();
    await timeout(100);
    Assert.contains(page.url(), "/deckViewer/");
    await page.waitForSelector("#DeckActions", { visible: true });
    await click(page, "#DeckActions");
    await page.waitForSelector("#actionDelete", { visible: true });
    await click(page, "#actionDelete");
    await page.waitForSelector("#deleteOverlay", { visible: true });
    await click(page, "#btnConfirmDelete");
    await page.waitForNavigation();
    Assert.contains(page.url(), "/cardsearch");
  }
}

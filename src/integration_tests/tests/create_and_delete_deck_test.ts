import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import {
  click,
  clickUntil,
  IntegrationTest,
  RunParams,
} from "../integration_test";

// This tests that the button in the toolbar can be used to create a new deck, and that the deck can be deleted with a deck action.
export default class CreateAndDeleteDeckTest extends IntegrationTest {
  name(): string {
    return "CreateAndDeleteDeckTest";
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.newPage();
    await page.goto(
      `https://${params.serverUrl}:${params.port}/cardsearch.html`
    );
    await timeout(100);
    await click(page, "#tb_mydecks");
    await click(page, ".tbDeck[data-deckid='']");
    await page.waitForNavigation();
    await timeout(100);
    await Assert.contains(page.url(), "/deckViewer/");
    await click(page, "#DeckActions");
    await clickUntil(page, "#actionDelete", async () => {
      return Assert.noError(Assert.visible(page, "#deleteOverlay"));
    });
    await click(page, "#btnConfirmDelete");
    await page.waitForNavigation();
    await Assert.contains(page.url(), "/cardsearch");
  }
}

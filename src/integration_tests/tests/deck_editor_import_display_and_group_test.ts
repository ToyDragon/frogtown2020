import { timeout } from "../../shared/utils";
import Assert from "../assertions";
import {
  click,
  clickUntil,
  IntegrationTest,
  RunParams,
  type,
} from "../integration_test";
import DeckEditorInfo from "./deck_editor/deck_editor_info";
import verifyDeckEditorDisplayGrid from "./deck_editor/verify_deck_editor_display_grid";

const cardIdA = "10544646-50d5-4225-a35f-e8396850fc0b";
const cardNameA = "Fireball";
const cardIdB = "00030770-5e99-4943-819d-8d807c24cc14";
const cardNameB = "Swamp";

// This tests that the bulk import action adds some cards to the mainboard.
export default class DeckEditorImportDisplayAndGroupTest extends IntegrationTest {
  name(): string {
    return "DeckEditorImportDisplayAndGroupTest";
  }

  private getParams(groupValueA: string, groupValueB: string): DeckEditorInfo {
    return {
      mainboard: [
        {
          id: cardIdA,
          name: cardNameA,
          count: 3,
          groupLabel: groupValueA,
        },
        {
          id: cardIdB,
          name: cardNameB,
          count: 2,
          groupLabel: groupValueB,
        },
      ],
      sideboard: [],
    };
  }

  async run(params: RunParams): Promise<void> {
    const page = await params.newPage();
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

    // Import some copies of two different cards.
    await click(page, "#DeckActions");
    await clickUntil(page, "#actionBulkImport", async () => {
      return Assert.noError(Assert.visible(page, "#importOverlay"));
    });
    await type(page, "#bulkInputArea", `3 ${cardIdA}\n2 ${cardIdB}\n`);
    await timeout(100);
    await clickUntil(page, "#btnConfirmImport", async () => {
      return Assert.noError(Assert.notVisible(page, "#btnConfirmImport"));
    });
    await timeout(1000);

    // Verify each display option.
    await verifyDeckEditorDisplayGrid(page, this.getParams("", ""));

    await click(page, "#DeckDisplayGroupers");
    await click(page, "#DeckDisplayGroupers li[data-value='IDToColor']");
    await verifyDeckEditorDisplayGrid(page, this.getParams("Red", "Colorless"));

    // Delete the deck.
    await click(page, "#DeckActions");
    await clickUntil(page, "#actionDelete", async () => {
      return Assert.noError(Assert.visible(page, "#deleteOverlay"));
    });
    await click(page, "#btnConfirmDelete");
    await page.waitForNavigation();
    Assert.contains(page.url(), "/cardsearch");
  }
}

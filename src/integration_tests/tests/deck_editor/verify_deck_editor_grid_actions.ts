// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Assert from "../../assertions";
import { click, clickUntil, type } from "../../integration_test";
import { deckEditorGridGetCardGroups } from "./deck_editor_grid_get_card_groups";
import DeckEditorInfo from "./deck_editor_info";
import verifyGroupContainersMatch from "./verify_group_containers_match";

export default async function verifyDeckEditorGridActions(
  page: puppeteer.Page,
  deck: DeckEditorInfo
): Promise<void> {
  // Test add.
  await page.hover(
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );
  await click(
    page,
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + .action.add`
  );
  deck.mainboard[0].count++;

  // Get the contents of all of the card containers, and verify they match the deck.
  await verifyGroupContainersMatch(
    await deckEditorGridGetCardGroups(page, "#deckArea", false),
    deck,
    false
  );

  // Test remove.
  await page.hover(
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );
  await click(
    page,
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + * + .action.remove`
  );
  deck.mainboard[0].count--;

  // Get the contents of all of the card containers, and verify they match the deck.
  await verifyGroupContainersMatch(
    await deckEditorGridGetCardGroups(page, "#deckArea", false),
    deck,
    false
  );

  // Test move to sideboard.
  await page.hover(
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );
  await click(
    page,
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + * + * + * + .action.sideboard`
  );
  deck.mainboard[0].count--;
  deck.sideboard.push({
    groupLabel: deck.mainboard[0].groupLabel,
    count: 1,
    id: deck.mainboard[0].id,
    name: deck.mainboard[0].name,
  });
  await verifyGroupContainersMatch(
    await deckEditorGridGetCardGroups(page, "#deckArea", false),
    deck,
    false
  );

  // Sets name filter to verify that 'show similar' doesn't change it.
  await type(page, "#inputName", "Cruel Ultimatum");

  // Test similar.
  await page.hover(
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );

  // Verify that the altPane popup opens when show similar button is clicked.
  await clickUntil(
    page,
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + * + * + .action.similar`,
    async () => {
      return await Assert.noError(Assert.visible(page, "#altPane"));
    }
  );

  // Verify that the cards that show up in the card search all have the same name.
  const data = await deckEditorGridGetCardGroups(
    page,
    "#altPaneCardArea",
    false
  );
  Assert.greaterThan(data.length, 0);
  for (const group of data) {
    for (const cardSet of group.contents) {
      for (const cardName in cardSet) {
        await Assert.equals(
          cardName.toLowerCase(),
          deck.mainboard[0].name.toLowerCase()
        );
      }
    }
  }

  // Adds 3 copies of an alternate artwork of one card.
  const altId = await page.$eval(
    `#altPaneCardArea .card:not([data-id='${deck.mainboard[0].id}'])`,
    (element) => {
      return element.getAttribute("data-id");
    }
  );
  await Assert.notEquals(altId, null);
  await page.hover(`#altPaneCardArea .card[data-id='${altId}']`);
  await page.click(`#altPaneCardArea .card[data-id='${altId}'] + .action.add`);
  await page.click(`#altPaneCardArea .card[data-id='${altId}'] + .action.add`);
  await page.click(`#altPaneCardArea .card[data-id='${altId}'] + .action.add`);
  await page.click(
    `#altPaneCardArea .card[data-id='${altId}'] + .action + .action.replaceAll`
  );
  /*await page.$eval("#altPaneSearch", (element) => {
    element.scrollTop = 0;
  });

  // Verify that the altPane popup closes when replaceAll is clicked.
  await page.hover(`#altPaneCardArea .card[data-id='${altId}']`);
  await clickUntil(
    page,
    `#altPaneCardArea .card[data-id='${altId}'] + .action + .action.replaceAll`,
    async () => {
      return await Assert.noError(Assert.notVisible(page, "#altPane"));
    }
  );*/

  // Asserts that the alternate art was added properly.
  deck.mainboard[0].id = altId!;
  deck.sideboard[deck.sideboard.length - 1].id = altId!;
  deck.mainboard[0].count += 3;
  await verifyGroupContainersMatch(
    await deckEditorGridGetCardGroups(page, "#deckArea", false),
    deck,
    false
  );

  // Verifies that the name filter remained unchanged by 'show similar'.
  await Assert.equals(
    await Assert.existsAndGetValue(page, "#inputName", "value"),
    "Cruel Ultimatum"
  );

  // Test move to mainboard.
  await page.hover(
    `#sideboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );
  await click(
    page,
    `#sideboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + * + * + * + .action.mainboard`
  );
  deck.mainboard[0].count++;
  deck.sideboard[deck.sideboard.length - 1].count--;
  await verifyGroupContainersMatch(
    await deckEditorGridGetCardGroups(page, "#deckArea", false),
    deck,
    false
  );

  // TODO: test star.
}

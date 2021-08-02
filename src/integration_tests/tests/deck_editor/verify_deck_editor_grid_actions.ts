// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Assert from "../../assertions";
import { click } from "../../integration_test";
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

  // Test similar.
  await click(page, "#filterSelection button");
  await click(page, "#filterSelection > div > ul > li[data-filtertype=text]");
  await click(page, "#filterSelection button");
  await click(page, "#filterSelection > div > ul > li[data-filtertype=rarity]");
  await click(page, "#filterSelection button");
  await click(page, "#filterSelection > div > ul > li[data-filtertype=set]");
  await page.hover(
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}']`
  );
  await click(
    page,
    `#mainboard .cardContainer > div[data-id='${deck.mainboard[0].id}'] + * + * + .action.similar`
  );

  // Verify only the misc filter is enabled.
  await Assert.equals(
    await page.evaluate(() => {
      const result: string[] = [];
      const eles = document.querySelectorAll(
        "#filterSelection > div > ul > li[data-active=true]"
      );
      for (const ele of eles) {
        result.push(ele.getAttribute("data-filtertype")!);
      }
      return result.join(", ");
    }),
    "misc"
  );

  // Verify only the show duplicates filter is enabled.
  await Assert.equals(
    await page.evaluate(() => {
      const result: string[] = [];
      const eles = document.querySelectorAll(
        "div[data-filtertype=misc] li[data-active=true]"
      );
      for (const ele of eles) {
        result.push(ele.getAttribute("data-value")!);
      }
      return result.join(", ");
    }),
    "Show Duplicates"
  );

  // Verify that the cards that show up in the card search all have the same name.
  const data = await deckEditorGridGetCardGroups(page, "#cardArea", false);
  Assert.greaterThan(data.length, 0);
  for (const group of data) {
    for (const cardSet of group.contents) {
      for (const cardName in cardSet) {
        await Assert.contains(
          cardName.toLowerCase(),
          deck.mainboard[0].name.toLowerCase()
        );
      }
    }
  }

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

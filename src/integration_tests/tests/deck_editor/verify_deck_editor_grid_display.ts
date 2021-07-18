// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Assert from "../../assertions";
import { deckEditorGridGetCardGroups } from "./deck_editor_grid_get_card_groups";
import DeckEditorInfo from "./deck_editor_info";
import verifyGroupContainersMatch from "./verify_group_containers_match";

export default async function verifyDeckEditorGridDisplay(
  page: puppeteer.Page,
  deck: DeckEditorInfo
): Promise<void> {
  const hasGroupers = deck.mainboard[0].groupLabel !== "";

  // Verify the grid display is selected by default.
  await Assert.equals(
    await page.evaluate(() => {
      return document
        .querySelector("#DeckDisplayDropdown li[data-active='true']")
        ?.getAttribute("data-value");
    }),
    "Grid"
  );

  // Verify each card container has actions.
  await Assert.equals(
    await page.evaluate(() => {
      let containers = document.querySelectorAll("#mainboard .cardContainer");
      let expectedActions = ["add", "remove", "similar", "star", "tosideboard"];
      const missingActions = [];
      for (const container of containers) {
        for (const action of expectedActions) {
          if (!container.querySelector(`div[data-action='${action}']`)) {
            missingActions.push("mainboard." + action);
          }
        }
      }

      containers = document.querySelectorAll("#sideboard .cardContainer");
      expectedActions = ["add", "remove", "similar", "star", "tomainboard"];
      for (const container of containers) {
        for (const action of expectedActions) {
          if (!container.querySelector(`div[data-action='${action}']`)) {
            missingActions.push("sideboard." + action);
          }
        }
      }
      return missingActions.join(",");
    }),
    ""
  );

  // Get the contents of all of the card containers, and verify they match the deck.
  const data = await deckEditorGridGetCardGroups(
    page,
    "#deckArea",
    hasGroupers
  );
  await verifyGroupContainersMatch(data, deck, hasGroupers, async (cardSet) => {
    await Assert.equals(Object.keys(cardSet).length, 1);
    const name = Object.keys(cardSet)[0];
    await Assert.lessThan(cardSet[name], 5);
  });

  // Verify that at least one card image is present.
  const imageData = await page.evaluate(() => {
    const result: string[] = [];
    const cardDivs = document.querySelectorAll<HTMLDivElement>("div[data-id]");
    for (const div of cardDivs) {
      if (
        div.style.backgroundImage &&
        div.style.backgroundImage.indexOf("CardBack") === -1
      ) {
        result.push(div.style.backgroundImage);
      }
    }
    return result;
  });
  await Assert.notEquals(imageData.length, 0);
}

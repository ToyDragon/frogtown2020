// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import ViewBehavior from "../../../views/shared/client/view_behavior";
import Assert from "../../assertions";
import DeckEditorInfo from "./deck_editor_info";

interface GroupContainers {
  groupLabel: string;
  contents: string[][];
}

// Parses the card IDs out of the card containers.
async function getDOMCardGroups(
  page: puppeteer.Page,
  hasGroupers: boolean
): Promise<GroupContainers[]> {
  return await page.evaluate((hasGroupers) => {
    return new Promise<GroupContainers[]>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewBehavior: ViewBehavior<unknown> = (window as any).behavior;
      viewBehavior.dl.onLoaded("IDToName").then(() => {
        const result: GroupContainers[] = [];
        const IDToName = viewBehavior.dl.getMapData("IDToName")!;
        if (hasGroupers) {
          const groups = document.querySelectorAll(".group");
          for (const group of groups) {
            const label = group.querySelector(".groupSeperator")!.textContent;
            const containers = group.querySelectorAll(".cardContainer");
            const groupContents: GroupContainers = {
              groupLabel: label || "",
              contents: [],
            };
            for (const container of containers) {
              const containerNames: string[] = [];
              const children = container.querySelectorAll("div[data-id]");
              for (const child of children) {
                const id = child.getAttribute("data-id");
                if (id) {
                  containerNames.push(IDToName[id]);
                }
              }
              groupContents.contents.push(containerNames);
            }
            result.push(groupContents);
          }
        } else {
          result.push({
            groupLabel: "",
            contents: [],
          });
          const containers = document.querySelectorAll(".cardContainer");
          for (const container of containers) {
            const containerNames: string[] = [];
            const children = container.querySelectorAll("div[data-id]");
            for (const child of children) {
              const id = child.getAttribute("data-id");
              if (id) {
                containerNames.push(IDToName[id]);
              }
            }
            result[0].contents.push(containerNames);
          }
        }
        resolve(result);
      });
    });
  }, hasGroupers);
}

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

  // Verify the cards are present.
  for (const card of deck.mainboard) {
    await Assert.equals(
      await page.evaluate((id) => {
        return document.querySelectorAll(`#mainboard div[data-id='${id}']`)
          .length;
      }, card.id),
      card.count
    );
  }
  for (const card of deck.sideboard) {
    await Assert.equals(
      await page.evaluate((id) => {
        return document.querySelectorAll(`#sideboard div[data-id='${id}']`)
          .length;
      }, card.id),
      card.count
    );
  }

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

  // Get the contents of all of the card containers.
  const data = await getDOMCardGroups(page, hasGroupers);
  for (const group of data) {
    const cleanGroupLabel = group.groupLabel.split("(")[0].trim().toLowerCase();
    const allowedNames: Record<string, boolean> = {};
    for (const card of deck.mainboard) {
      if (!hasGroupers || card.groupLabel.toLowerCase() === cleanGroupLabel) {
        allowedNames[card.name] = true;
      }
    }
    for (const card of deck.sideboard) {
      if (!hasGroupers || card.groupLabel.toLowerCase() === cleanGroupLabel) {
        allowedNames[card.name] = true;
      }
    }

    // Verify all card containers contain at most 4 cards, and only cards with the same name.
    for (const cardSet of group.contents) {
      await Assert.greaterThan(cardSet.length, 0);
      await Assert.lessThan(cardSet.length, 5);
      await Assert.true(allowedNames[cardSet[0]]);
      for (let i = 1; i < cardSet.length; ++i) {
        await Assert.equals(cardSet[i], cardSet[0]);
      }
    }
  }

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

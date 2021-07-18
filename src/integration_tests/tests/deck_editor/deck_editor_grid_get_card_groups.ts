// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import ViewBehavior from "../../../views/shared/client/view_behavior";

export interface GroupContainers {
  groupLabel: string;
  contents: Record<string, number>[];
}

// Parses the card IDs out of the card containers.
export async function deckEditorGridGetCardGroups(
  page: puppeteer.Page,
  rootId: string,
  hasGroupers: boolean
): Promise<GroupContainers[]> {
  const result = await page.evaluate(
    (hasGroupers, rootId) => {
      return new Promise<GroupContainers[] | string>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewBehavior: ViewBehavior<unknown> = (window as any).behavior;
        viewBehavior.dl.onLoaded("IDToName").then(() => {
          try {
            const result: GroupContainers[] = [];
            const IDToName = viewBehavior.dl.getMapData("IDToName")!;
            if (hasGroupers) {
              const groups = document.querySelectorAll(`${rootId} .group`);
              for (const group of groups) {
                const label = group.querySelector(".groupSeperator")!
                  .textContent;
                const containers = group.querySelectorAll(".cardContainer");
                const groupContents: GroupContainers = {
                  groupLabel: label || "",
                  contents: [],
                };
                for (const container of containers) {
                  const containerNames: Record<string, number> = {};
                  const children = container.querySelectorAll("div[data-id]");
                  for (const child of children) {
                    const id = child.getAttribute("data-id");
                    if (id) {
                      const name = IDToName[id];
                      containerNames[name] = containerNames[name] || 0;
                      containerNames[name]++;
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
              const containers = document.querySelectorAll(
                `${rootId} .cardContainer`
              );
              for (const container of containers) {
                const containerNames: Record<string, number> = {};
                const children = container.querySelectorAll("div[data-id]");
                for (const child of children) {
                  const id = child.getAttribute("data-id");
                  if (id) {
                    const name = IDToName[id];
                    containerNames[name] = containerNames[name] || 0;
                    containerNames[name]++;
                  }
                }
                result[0].contents.push(containerNames);
              }
            }
            resolve(result);
          } catch (e) {
            const ee = e as Error;
            resolve(`${ee.name}\n${ee.message}\n${ee.stack}`);
          }
        });
      });
    },
    hasGroupers,
    rootId
  );
  if (Array.isArray(result)) {
    return result;
  }
  throw new Error(result);
}

import Assert from "../../assertions";
import { GroupContainers } from "./deck_editor_grid_get_card_groups";
import DeckEditorInfo from "./deck_editor_info";

export default async function verifyGroupContainersMatch(
  data: GroupContainers[],
  deck: DeckEditorInfo,
  hasGroupers: boolean,
  additionalCardSetCheck?: (cardSet: Record<string, number>) => Promise<void>
): Promise<void> {
  for (const group of data) {
    const cleanGroupLabel = group.groupLabel.split("(")[0].trim().toLowerCase();
    const allowedNames: Record<string, number> = {};
    for (const card of deck.mainboard) {
      if (!hasGroupers || card.groupLabel.toLowerCase() === cleanGroupLabel) {
        allowedNames[card.name] = allowedNames[card.name] || 0;
        allowedNames[card.name] += card.count;
      }
    }
    for (const card of deck.sideboard) {
      if (!hasGroupers || card.groupLabel.toLowerCase() === cleanGroupLabel) {
        allowedNames[card.name] = allowedNames[card.name] || 0;
        allowedNames[card.name] += card.count;
      }
    }

    // Verify all card containers contain at most 4 cards, and only cards with the same name.
    for (const cardSet of group.contents) {
      for (const name in cardSet) {
        allowedNames[name] = allowedNames[name] || 0;
        allowedNames[name] -= cardSet[name];
      }
      if (additionalCardSetCheck) {
        await additionalCardSetCheck(cardSet);
      }
    }

    // Verify the expected amount of cards were found.
    for (const name in allowedNames) {
      await Assert.equals(allowedNames[name], 0);
    }
  }
}

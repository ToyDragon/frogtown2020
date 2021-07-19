// Remove a bunch of entropy from a card name. For example, turns "Waste Land" into "wasteland".
// This is used later for comparing card names, so it should retain enough information so that the intended cards can be matched.
function lowEntropyName(original_name: string): string {
  return original_name
    .toLowerCase()
    .split("/")[0] // Some cards with multiple names on the face have this character, such as "Breaking // Entering".
    .replace(/[^a-zA-Z]/g, "");
}

function constructLowEntropyNameMap(
  nameToID: Record<string, string[]>
): { [name: string]: string } {
  const lowEntropyNameToID: { [name: string]: string } = {};
  for (const name in nameToID) {
    const id = nameToID[name][0];
    const leName = lowEntropyName(name);
    lowEntropyNameToID[leName] = id;
  }
  return lowEntropyNameToID;
}

function constructLowercaseNameMap(
  nameToID: Record<string, string[]>
): { [name: string]: string } {
  const lowercaseNameToID: { [name: string]: string } = {};
  for (const name in nameToID) {
    const id = nameToID[name][0];
    lowercaseNameToID[name.toLowerCase()] = id;
  }
  return lowercaseNameToID;
}

interface BulkEntryLinePieces {
  count: number;
  text: string;
}

function splitBulkEntryLine(line: string): BulkEntryLinePieces | null {
  const splitRegex = /([0-9]+)?x?\s*([a-zA-Z0-9, '`-]+)/;
  const result = splitRegex.exec(line);
  if (!result) {
    return null;
  }

  return {
    count: Number(result[1] || "1"),
    text: result[2],
  };
}

function checkForExactCardId(pieces: BulkEntryLinePieces): string | null {
  const idRegex = /[a-z0-9-]{36}/;
  if (!pieces.text.match(idRegex)) {
    return null;
  }
  return pieces.text;
}

export function parseBulkEntryTextToCardIDs(
  bulkEntryText: string,
  nameToID: Record<string, string[]>
): { ids: string[]; errors: string[] } {
  const result: { ids: string[]; errors: string[] } = { ids: [], errors: [] };

  // These maps are very expensive to construct, but we do it anyways because this only happens once when performing a bulk import.
  // Bulk imports are typically slow, and this contributes to that, but it's an intended trade off for legible code.
  const lowEntropyNameToID = constructLowEntropyNameMap(nameToID);
  const lowercaseNameToID = constructLowercaseNameMap(nameToID);

  const bulkLines = bulkEntryText.split("\n");
  for (const line of bulkLines) {
    const pieces = splitBulkEntryLine(line);
    if (!pieces) {
      // The line was likely empty, ignore it.
      continue;
    }
    let cardId: string | null = checkForExactCardId(pieces);
    if (!cardId) {
      // Start with a case-insensitive match on name, to catch near-perfectly entered cards.
      cardId = lowercaseNameToID[pieces.text.toLowerCase()];
    }
    if (!cardId) {
      // Then try matching on a low entropy version of the card name, that removes symbols and spaces.
      cardId = lowEntropyNameToID[lowEntropyName(pieces.text)];
    }
    if (!cardId) {
      result.errors.push(pieces.text);
      continue;
    }

    for (let i = 0; i < pieces.count; i++) {
      result.ids.push(cardId);
    }
  }
  return result;
}

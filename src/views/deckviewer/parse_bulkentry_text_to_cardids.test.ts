import { parseBulkEntryTextToCardIDs } from "./parse_bulkentry_text_to_cardids";

const nameToID: Record<string, string[]> = {};
nameToID["a"] = ["1", "2"];
nameToID["b"] = ["3"];
nameToID["c"] = ["4"];
nameToID["Wasteland"] = ["5"];
nameToID["Waste land"] = ["6"];

test("Handles simple single line.", () => {
  let result = parseBulkEntryTextToCardIDs("2 a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = parseBulkEntryTextToCardIDs("2xa", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = parseBulkEntryTextToCardIDs("2x a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = parseBulkEntryTextToCardIDs("a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1"]);
});

test("Handles multiple lines.", () => {
  const result = parseBulkEntryTextToCardIDs("2 a\nb", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1", "3"]);
});

test("Handles whitespace gracefully", () => {
  const result = parseBulkEntryTextToCardIDs("\t2 a\n\t\tb", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "3"]);
});

test("Detects errors", () => {
  const result = parseBulkEntryTextToCardIDs(
    "\t2 a\n\t\tb\nx\nz\nb\nc",
    nameToID
  );
  expect(result.errors).toEqual(["x", "z"]);
  expect(result.ids).toEqual(["1", "3", "3", "4"]);
});

test("Wasteland Waste Land", () => {
  // Currently fails :(
  const result = parseBulkEntryTextToCardIDs(
    "1 Wasteland\n2 Waste land\n2 wasteland\n1 waste land",
    nameToID
  );
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["5", "6", "6", "5", "5", "6"]);
});

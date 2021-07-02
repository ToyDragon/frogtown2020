import { getCardsByName } from "./action_bulkimport";

const nameToID: Record<string, string[]> = {};
nameToID["a"] = ["1", "2"];
nameToID["b"] = ["3"];
nameToID["c"] = ["4"];
nameToID["Wasteland"] = ["5"];
nameToID["Waste land"] = ["6"];

const idToName: Record<string, string> = {};
idToName["1"] = "a";
idToName["2"] = "a";
idToName["3"] = "b";
idToName["4"] = "c";
idToName["5"] = "Wasteland";
idToName["6"] = "Waste land";

test("Handles simple single line.", () => {
  let result = getCardsByName("2 a", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2xa", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2x a", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("a", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1"]);
});

test("Handles multiple lines.", () => {
  const result = getCardsByName("2 a\nb", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1", "3"]);
});

test("Handles whitespace gracefully", () => {
  const result = getCardsByName("\t2 a\n\t\tb", nameToID, idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "3"]);
});

test("Detects errors", () => {
  const result = getCardsByName("\t2 a\n\t\tb\nx\nz\nb\nc", nameToID, idToName);
  expect(result.errors).toEqual(["x", "z"]);
  expect(result.ids).toEqual(["1", "3", "3", "4"]);
});

test("Wasteland Waste Land", () => {
  // Currently fails :(
  const result = getCardsByName(
    "1 Wasteland\n2 Waste land\n2 wasteland\n1 waste land",
    nameToID,
    idToName
  );
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["5", "6", "6", "5", "5", "6"]);
});

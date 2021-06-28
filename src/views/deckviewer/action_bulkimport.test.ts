import { getCardsByName } from "./action_bulkimport";

const idToName: Record<string, string[]> = {};
idToName["a"] = ["1", "2"];
idToName["b"] = ["3"];
idToName["c"] = ["4"];
idToName["wasteland"] = ["5"];
idToName["waste land"] = ["6"];

test("Handles simple single line.", () => {
  let result = getCardsByName("2 a", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2xa", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2x a", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("a", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1"]);
});

test("Handles multiple lines.", () => {
  const result = getCardsByName("2 a\nb", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1", "3"]);
});

test("Handles whitespace gracefully", () => {
  const result = getCardsByName("\t2 a\n\t\tb", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "3"]);
});

test("Detects errors", () => {
  const result = getCardsByName("\t2 a\n\t\tb\nx\nz\nb\nc", idToName);
  expect(result.errors).toEqual(["x", "z"]);
  expect(result.ids).toEqual(["1", "3", "3", "4"]);
});

test("Wasteland Waste Land", () => {
  // Currently fails :(
  const result = getCardsByName("1 wasteland\n2 waste land", idToName);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["5", "6", "6"]);
});

import { getCardsByName } from "./action_bulkimport";

const nameToID: Record<string, string[]> = {};
nameToID["a"] = ["1", "2"];
nameToID["b"] = ["3"];
nameToID["c"] = ["4"];
nameToID["wasteland"] = ["5"];
nameToID["waste land"] = ["6"];

test("Handles simple single line.", () => {
  let result = getCardsByName("2 a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2xa", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("2x a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1"]);

  result = getCardsByName("a", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1"]);
});

test("Handles multiple lines.", () => {
  const result = getCardsByName("2 a\nb", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "1", "3"]);
});

test("Handles whitespace gracefully", () => {
  const result = getCardsByName("\t2 a\n\t\tb", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["1", "3"]);
});

test("Detects errors", () => {
  const result = getCardsByName("\t2 a\n\t\tb\nx\nz\nb\nc", nameToID);
  expect(result.errors).toEqual(["x", "z"]);
  expect(result.ids).toEqual(["1", "3", "3", "4"]);
});

test("Wasteland Waste Land", () => {
  // Currently fails :(
  const result = getCardsByName("1 wasteland\n2 waste land", nameToID);
  expect(result.errors).toEqual([]);
  expect(result.ids).toEqual(["5", "6", "6"]);
});

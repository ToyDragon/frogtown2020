import { getCardsByName } from "./action_bulkimport";

const idToName: Record<string, string[]> = {};
idToName["a"] = ["1", "2"];
idToName["b"] = ["3"];
idToName["c"] = ["4"];

test("Handles simple single line.", () => {
  let result = getCardsByName("2 a", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(2);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");

  result = getCardsByName("2xa", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(2);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");

  result = getCardsByName("2x a", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(2);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");

  result = getCardsByName("a", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(1);
  expect(result.ids[0]).toBe("1");
});

test("Handles multiple lines.", () => {
  const result = getCardsByName("2 a\nb", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(3);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");
  expect(result.ids[2]).toBe("3");
});

test("Handles whitespace gracefully", () => {
  const result = getCardsByName("\t2 a\n\t\tb", idToName);
  expect(result.errors.length).toBe(0);
  expect(result.ids.length).toBe(3);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");
  expect(result.ids[2]).toBe("3");
});

test("Detects errors", () => {
  const result = getCardsByName("\t2 a\n\t\tb\nd\ne\nb", idToName);
  expect(result.errors.length).toBe(2);
  expect(result.errors[0]).toBe("d");
  expect(result.errors[1]).toBe("e");
  expect(result.ids.length).toBe(4);
  expect(result.ids[0]).toBe("1");
  expect(result.ids[1]).toBe("1");
  expect(result.ids[2]).toBe("3");
  expect(result.ids[3]).toBe("3");
});

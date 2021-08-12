import { timeout } from "../../../shared/utils";
import { MemoryDataLoader } from "./memory_data_loader";

test("Tests injectMapData, getMapData, and getAnyMapData with two different map types.", () => {
  const md = new MemoryDataLoader();
  md.injectMapData("IDToName", {
    "1": "T1",
    "2": "T2",
  });
  md.injectMapData("IDToToughness", {
    1: "One",
    2: "Two",
    3: "Three",
  });
  expect(md.getMapData("IDToName")).toStrictEqual({ "1": "T1", "2": "T2" });
  expect(md.getAnyMapData("IDToName")).toStrictEqual({ "1": "T1", "2": "T2" });
  expect(md.getMapData("IDToToughness")).toStrictEqual({
    1: "One",
    2: "Two",
    3: "Three",
  });
  expect(md.getAnyMapData("IDToToughness")).toStrictEqual({
    1: "One",
    2: "Two",
    3: "Three",
  });
});

test("Ensures that onLoaded, onLoadedAll, and isDoneLoading return immediately", async () => {
  const md = new MemoryDataLoader();
  let callbackCallCount = 0;
  md.injectMapData("IDToName", {});
  md.onLoadedCB("IDToName", () => {
    callbackCallCount++;
  });
  md.onAllLoadedCB(["IDToName"], () => {
    callbackCallCount++;
  });
  await timeout(51);
  expect(callbackCallCount).toBe(2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(md.isDoneLoading("IDToName" as any)).toBe(true);
});

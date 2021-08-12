import { MemoryDataLoader } from "../memory_data_loader";
import { FilterText } from "./filter_text";

const dl = new MemoryDataLoader();
dl.injectMapData("IDToName", {
  "1": "Wasteland",
  "2": "Wasteland",
  "3": "Wasteland Viper",
  "4": "Wasteland Wanderer",
  "5": "Wastes",
});

test("Ensures that the strict match filter is properly applied", () => {
  const nameFilter = new FilterText(dl, "name", () => {}, {
    dataMapName: "",
    idMapName: "IDToName",
    dynamicOptions: false,
    excludedOptions: {},
    filterClass: "",
  });

  const cardIds: string[] = [];
  nameFilter.setValue("Wasteland");
  nameFilter.apply(cardIds, true, { "Strict Matching": true });
  expect(cardIds).toStrictEqual(["1", "2"]);
});

test("Ensures that the regular name filter is properly applied", () => {
  const nameFilter = new FilterText(dl, "name", () => {}, {
    dataMapName: "",
    idMapName: "IDToName",
    dynamicOptions: false,
    excludedOptions: {},
    filterClass: "",
  });
  const cardIds: string[] = [];
  nameFilter.setValue("Wasteland");
  nameFilter.apply(cardIds, true, {});
  expect(cardIds).toStrictEqual(["1", "2", "3", "4"]);
});

test("Returns an empty array when no required value is specified", () => {
  const nameFilter = new FilterText(dl, "name", () => {}, {
    dataMapName: "",
    idMapName: "IDToName",
    dynamicOptions: false,
    excludedOptions: {},
    filterClass: "",
  });
  const cardIds: string[] = [];
  nameFilter.apply(cardIds, true, {});
  expect(cardIds).toStrictEqual([]);
});

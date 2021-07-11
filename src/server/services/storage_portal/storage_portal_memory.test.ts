import { Clock } from "../clock";
import MemoryStoragePortal from "./storage_portal_memory";

const c: Clock = {
  now: () => {
    return new Date("1-1-21 15:23 UTC");
  },
};

test("Can upload string", async () => {
  const s = new MemoryStoragePortal(c);
  await s.uploadStringToBucket("a", "b", "c");
  expect(await s.getObjectAsString("a", "b")).toEqual("c");
  expect(new Date(await s.getObjectChangedDate("a", "b"))).toEqual(c.now());
});

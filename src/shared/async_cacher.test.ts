import { AsyncCacher } from "./async_cacher";

function timeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, millis);
  });
}

const seen: Record<string, number> = {};
const retriever = async (key: string) => {
  await timeout(75);
  seen[key] = seen[key] || 0;
  seen[key] += 1;
  return key + "_" + seen[key];
};

test(".", async (done) => {
  const asyncCacher = new AsyncCacher(50, retriever);
  expect(await asyncCacher.get("a")).toBe("a_1");
  expect(await asyncCacher.get("a")).toBe("a_1");
  expect(await asyncCacher.get("a")).toBe("a_1");
  await timeout(35);
  expect(await asyncCacher.get("a")).toBe("a_1");
  await timeout(35);
  expect(await asyncCacher.get("a")).toBe("a_2");
  await timeout(35);
  expect(await asyncCacher.get("a")).toBe("a_2");
  await timeout(10);
  expect(await asyncCacher.get("a")).toBe("a_2");
  await timeout(200);
  expect(await asyncCacher.get("a")).toBe("a_3");
  done();
});

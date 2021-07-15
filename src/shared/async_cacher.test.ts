import { AsyncCacher } from "./async_cacher";

function timeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, millis);
  });
}

function getRetriever(): (key: string) => Promise<string> {
  const seen: Record<string, number> = {};
  return async (key: string) => {
    await timeout(75);
    seen[key] = seen[key] || 0;
    seen[key] += 1;
    return key + "_" + seen[key];
  };
}

test("Expires the cache.", async (done) => {
  const asyncCacher = new AsyncCacher(200, getRetriever());
  expect(await asyncCacher.get("a")).toBe("a_1");
  expect(await asyncCacher.get("a")).toBe("a_1");
  expect(await asyncCacher.get("a")).toBe("a_1");
  await timeout(35);
  expect(await asyncCacher.get("a")).toBe("a_1");
  await timeout(35);
  expect(await asyncCacher.get("a")).toBe("a_1");

  await timeout(400);
  expect(await asyncCacher.get("a")).toBe("a_2");
  await timeout(10);
  expect(await asyncCacher.get("a")).toBe("a_2");
  await timeout(10);
  expect(await asyncCacher.get("a")).toBe("a_2");

  await timeout(400);
  expect(await asyncCacher.get("a")).toBe("a_3");
  done();
});

test("Only lets one update be in flight per key.", async (done) => {
  const asyncCacher = new AsyncCacher(50, getRetriever());
  const promise1 = asyncCacher.get("a");
  const promise2 = asyncCacher.get("a");
  const promise3 = asyncCacher.get("a");
  expect(await promise1).toBe("a_1");
  expect(await promise2).toBe("a_1");
  expect(await promise3).toBe("a_1");
  done();
});

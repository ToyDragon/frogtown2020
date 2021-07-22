import { resolveOrTimeout } from "./resolve_or_timeout";
import { timeout } from "./utils";

test("Case where promise doesn't timeout", async () => {
  const testPromise = (async () => {
    await timeout(100);
    return "Promise completed";
  })();
  const result = await resolveOrTimeout(testPromise, 200);
  expect(result.result).toBe("Promise completed");
  expect(result.timedOut).toBe(false);
  expect(result.promise).toBeUndefined();
});

test("Case where promies DOES timeout", async () => {
  const result = await resolveOrTimeout(timeout(200), 100);
  expect(result.result).toBeUndefined();
  expect(result.timedOut).toBe(true);
  expect(result.promise).toStrictEqual(timeout(200));
});

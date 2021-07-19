/*function timeout(millis: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, millis);
    });
  }*/

import { resolveOrTimeout } from "./resolve_or_timeout";

test("Case where promise doesn't timeout", async () => {
  const testPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("Promise completed");
    }, 100);
  });
  const temp = await resolveOrTimeout(testPromise, 200);
  expect(temp.result).toBe("Promise completed");
  expect(temp.timedOut).toBe(false);
  expect(temp.promise).toBeUndefined();
});

test("Case where promies DOES timeout", async () => {
  const testPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("Promise completed");
    }, 200);
  });
  const temp = await resolveOrTimeout(testPromise, 100);
  expect(temp.result).toBeUndefined;
  expect(temp.timedOut).toBe(true);
  expect(temp.promise).toBe(testPromise);
});

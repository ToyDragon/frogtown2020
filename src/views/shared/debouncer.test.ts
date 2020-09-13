import Debouncer from "./debouncer";

function asyncTimeout(delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

test("Waits for delay before resolving", async (done) => {
  const expectedDelay = 100;
  const debouncer = new Debouncer(expectedDelay);
  const start = new Date();
  expect(await debouncer.waitAndShouldAct()).toBe(true);
  expect(new Date().getTime() - start.getTime()).toBeGreaterThan(
    expectedDelay * 0.9
  );
  expect(new Date().getTime() - start.getTime()).toBeLessThan(
    expectedDelay * 1.1
  );
  done();
});

test("Handles multiple inputs", async (done) => {
  const expectedDelay = 100;
  const debouncer = new Debouncer(expectedDelay);
  const start = new Date();

  const firstBouncePromise = debouncer.waitAndShouldAct();
  await asyncTimeout(50);
  const secondBouncePromise = debouncer.waitAndShouldAct();
  await asyncTimeout(25);
  const thirdBouncePromise = debouncer.waitAndShouldAct();

  expect(await firstBouncePromise).toBe(false);
  expect(await secondBouncePromise).toBe(false);
  expect(await thirdBouncePromise).toBe(true);
  expect(new Date().getTime() - start.getTime()).toBeGreaterThan(150);
  done();
});

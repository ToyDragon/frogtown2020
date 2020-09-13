import { RateLimiter } from "./rate_limiter";

test("Doesn't screw up the stack if nothing is pending.", async (done) => {
  let setToTrueAfterStackClear = false;
  setTimeout(() => {
    setToTrueAfterStackClear = true;
  }, 0);

  const limiter = new RateLimiter(100);
  await limiter.lock();
  limiter.unlock();
  expect(setToTrueAfterStackClear).toBe(false);
  done();
});

test("Waits if called multiple times.", async (done) => {
  const start = new Date();
  const limiter = new RateLimiter(100);
  await limiter.lock(); // There is no delay on the first call, this is separate to emphasize that.
  limiter.unlock();
  let expectedDelay = 0;
  for (let i = 0; i < 4; i++) {
    await limiter.lock();
    limiter.unlock();
    expectedDelay += 100;
  }
  const realDelay = new Date().getTime() - start.getTime();
  expect(realDelay).toBeGreaterThan(expectedDelay * 0.9);
  expect(realDelay).toBeLessThan(expectedDelay * 1.1);
  done();
});

test("Resolves promises in the order they are made.", async (done) => {
  const limiter = new RateLimiter(100);
  let resolveCount = 0;
  const allPromises = [
    limiter.lock().then(() => {
      limiter.unlock();
      expect(resolveCount).toBe(0);
      resolveCount++;
    }),
    limiter.lock().then(() => {
      limiter.unlock();
      expect(resolveCount).toBe(1);
      resolveCount++;
    }),
    limiter.lock().then(() => {
      limiter.unlock();
      expect(resolveCount).toBe(2);
      resolveCount++;
    }),
    limiter.lock().then(() => {
      limiter.unlock();
      expect(resolveCount).toBe(3);
      resolveCount++;
    }),
  ];
  await Promise.all(allPromises);
  done();
});

test("Multiple calls to lock wait for previous calls to unlock.", async (done) => {
  const limiter = new RateLimiter(100);
  await limiter.lock();
  let isLocked = true;
  limiter.lock().then(() => {
    expect(isLocked).toBe(false);
    done();
  });
  setTimeout(() => {
    isLocked = false;
    limiter.unlock();
  }, 200); // 200 is much longer than the expected 100ms delay
});

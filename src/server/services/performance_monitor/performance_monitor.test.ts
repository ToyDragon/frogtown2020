import { wait } from "../../../shared/utils";
import { PerformanceMonitor, SummaryData } from "./performance_monitor";

expect.extend({
  expectSummary(
    data: SummaryData,
    label: string,
    occurances: number,
    millis: number
  ) {
    let pass = true;
    let message = "";

    if (data.label !== label) {
      message += `expected label (${data.label}) to be ${label}.\n`;
      pass = false;
    }
    if (data.total_occurances !== occurances) {
      message += `expected total_occurances (${data.total_occurances}) to be ${occurances}.\n`;
      pass = false;
    }
    if (data.total_millis < millis * 0.9 || data.total_millis > millis * 1.1) {
      message +=
        `expected total_millis (${data.total_millis}) to be between ` +
        `${millis * 0.9} and ${millis * 1.1}.\n`;
      pass = false;
    }

    if (occurances === 1 && data.max_millis !== data.total_millis) {
      message +=
        `expected max_millis (${data.max_millis}) to be equal total_millis ` +
        +`${data.total_millis}.\n`;
      pass = false;
    }

    return {
      pass: pass,
      message: () => {
        return message;
      },
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      expectSummary(
        label: string,
        occurances: number,
        millis: number
      ): CustomMatcherResult;
    }
  }
}

test("one layer", (done) => {
  (async () => {
    const monitor = new PerformanceMonitor();
    const perfSession = monitor.StartSession("test-a");
    await wait(1000);
    perfSession.Pop();

    const perfSummary = monitor.GetSummary();
    expect(perfSummary["test-a"]).expectSummary("test-a", 1, 1000);
    done();
  })();
});

test("two layers", (done) => {
  (async () => {
    const monitor = new PerformanceMonitor();
    const perfSession = monitor.StartSession("test-a");
    await wait(200);
    {
      perfSession.Push("child-a");
      await wait(100);
      perfSession.Pop();
    }
    {
      perfSession.Push("child-b");
      await wait(200);
      perfSession.Pop();
    }
    perfSession.Pop();
    const perfSummary = monitor.GetSummary();

    expect(perfSummary["test-a"]).expectSummary("test-a", 1, 500);

    expect(perfSummary["test-a"].children["child-a"]).expectSummary(
      "child-a",
      1,
      100
    );
    expect(perfSummary["child-a"]).expectSummary("child-a", 1, 100);

    expect(perfSummary["test-a"].children["child-b"]).expectSummary(
      "child-b",
      1,
      200
    );
    expect(perfSummary["child-b"]).expectSummary("child-b", 1, 200);

    done();
  })();
});

test("two layers with repetition", (done) => {
  (async () => {
    const monitor = new PerformanceMonitor();
    {
      const perfSession = monitor.StartSession("test-a");
      await wait(200);
      {
        perfSession.Push("child-a");
        await wait(100);
        perfSession.Pop();
      }
      {
        perfSession.Push("child-b");
        await wait(200);
        perfSession.Pop();
      }
      perfSession.Pop();
    }

    {
      const perfSession = monitor.StartSession("child-a");
      await wait(400);
      perfSession.Pop();
    }

    const perfSummary = monitor.GetSummary();

    expect(perfSummary["test-a"]).expectSummary("test-a", 1, 500);
    expect(perfSummary["test-a"].children["child-a"]).expectSummary(
      "child-a",
      1,
      100
    );
    expect(perfSummary["child-a"]).expectSummary("child-a", 2, 500);
    expect(perfSummary["test-a"].children["child-b"]).expectSummary(
      "child-b",
      1,
      200
    );
    expect(perfSummary["child-b"]).expectSummary("child-b", 1, 200);

    done();
  })();
});

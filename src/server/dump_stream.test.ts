import * as stream from "stream";
import { timeout } from "../shared/utils";
import dumpStream from "./dump_stream";

test("Dumps stream", async () => {
  const s = new stream.Stream();
  (async () => {
    await timeout(10);
    s.emit("data", "1");
    await timeout(10);
    s.emit("data", "2");
    await timeout(10);
    s.emit("data", "3");
    await timeout(10);
    s.emit("data", "4");
    s.emit("end");
  })();

  expect(await dumpStream(s)).toBe("1234");
});

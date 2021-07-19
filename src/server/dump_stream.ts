import * as stream from "stream";

export default function dumpStream(s: stream.Stream): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    s.on("data", (chunk) => {
      data += chunk;
    });
    s.on("end", () => {
      resolve(data);
    });
  });
}

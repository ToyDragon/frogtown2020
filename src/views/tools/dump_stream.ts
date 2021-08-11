export default function dumpStream(
  s: NodeJS.ReadableStream
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    let data: Buffer | null = null;
    s.on("data", (chunk: Buffer) => {
      if (!data) {
        data = chunk;
      } else {
        data = Buffer.concat([data, chunk]);
      }
    });
    s.on("close", () => {
      resolve(data);
    });
  });
}

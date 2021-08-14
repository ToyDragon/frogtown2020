// Helper to dump a readable stream to a buffer.
// TODO: This is kind of redundant with the dump_stream in server/, so resolve that.
// Either combine them, or make it more obvious that they operate on different
// types of streams.
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

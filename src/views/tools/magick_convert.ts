import { spawn, execSync } from "child_process";
import { logError } from "../../server/log";
import dumpStream from "./dump_stream";

// Helper to run imagemagick tool on a buffer of jpg data.
export default async function magickConvert(
  buffer: Buffer,
  newSize: string,
  quality: number
): Promise<Buffer | null> {
  const childProc = spawn("convert", [
    "-resize",
    newSize,
    "-quality",
    quality.toString(),
    "-colorspace",
    "RGB",
    "jpeg:-",
    "-",
  ]);
  childProc.stdin.end(buffer);
  childProc.stderr.on("data", (chunk) => {
    logError("Convert err: " + chunk);
    logError(execSync("convert -list configure"));
  });
  return await dumpStream(childProc.stdout);
}

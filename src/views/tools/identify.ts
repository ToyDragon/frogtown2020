import { spawn } from "child_process";
import dumpStream from "./dump_stream";

// Helper to run imagemagick's identify tool on a buffer of jpg data.
export default async function identify(jpgData: Buffer): Promise<string> {
  const childProc = spawn("identify", ["-"]);
  childProc.stdin.end(jpgData);
  const result = await dumpStream(childProc.stdout);
  return result?.toString() || "";
}

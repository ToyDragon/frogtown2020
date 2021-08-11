import { spawn } from "child_process";

// Helper to run imagemagick's identify tool on a buffer of jpg data.
export default function identify(jpgData: Buffer): Promise<string> {
  return new Promise((resolve) => {
    const childProc = spawn("identify", ["-"]);
    childProc.stdin.end(jpgData);
    let data: Buffer | null = null;
    childProc.stdout.on("data", (chunk: Buffer) => {
      if (!data) {
        data = chunk;
      } else {
        data = Buffer.concat([data, chunk]);
      }
    });
    childProc.on("exit", () => {
      resolve(data?.toString() || "");
    });
  });
}
import cluster from "cluster";

import { timeout } from "../shared/utils";
import Updater from "./updater";

const workers: cluster.Worker[] = [];
const deadWorkers: Record<string, boolean> = {};

if (cluster.isMaster) {
  // We only use cluster as a fault tolerance layer, we don't actually use any paralellism.
  workers.push(cluster.fork());

  cluster.on("exit", (worker, code, _signal) => {
    deadWorkers[worker.id] = true;
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log("Worker " + worker.id + " crashed. Starting a new worker...");
      cluster.fork();
    }
  });

  process.on("SIGINT", async () => {
    for (let i = 0; i < 10; i++) {
      let aliveCount = 0;
      for (const worker of workers) {
        if (!deadWorkers[worker.id]) {
          aliveCount++;
        }
      }
      if (aliveCount === 0) {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      } else {
        console.log(
          "Runner: Waiting for " + aliveCount + " servers to close..."
        );
        await timeout(2500);
      }
    }
  });
} else {
  new Updater().run();
}

import cluster from "cluster";
import * as process from "process";

import Server from "./server";

if (cluster.isMaster) {
  // Only do two instance per node. Scale further with k8s
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, _signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log("Worker " + worker.id + " crashed. Starting a new worker...");
      cluster.fork();
    }
  });
} else {
  new Server().run(process.pid.toString());
}

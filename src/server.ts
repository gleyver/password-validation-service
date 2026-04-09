import process from "node:process";
import { buildApplication } from "./app.js";
import { printServerReady } from "./platform/logging/print-server-ready.js";

/** Sempre escuta em todas as interfaces (acessível como localhost na máquina). */
const HOST = "0.0.0.0";

/** Primeira porta tentada; se estiver ocupada, tenta 3001, 3002, … */
const FIRST_PORT = 3000;

const { app, logger } = buildApplication();

const { port } = await app.listenAvailable(HOST, FIRST_PORT);
printServerReady(port, HOST);
logger.log("info", "server_listening", { port, host: HOST });

let shutdownStarted = false;

function shutdownProcess(signal: string): void {
  if (shutdownStarted) {
    process.exit(1);
  }
  shutdownStarted = true;
  logger.log("info", "server_shutting_down", { signal });
  void app
    .close()
    .then(() => {
      logger.log("info", "server_closed", { port });
      process.exit(0);
    })
    .catch((err: unknown) => {
      logger.log("error", "server_close_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    });
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => shutdownProcess(signal));
}

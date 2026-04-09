import process from "node:process";
import { buildApplication } from "./app.js";
import { printServerReady } from "./platform/logging/print-server-ready.js";

/** Bind em todas as interfaces (acesso local via `localhost` ou IP da máquina). */
const HOST = "0.0.0.0";

/** Porta inicial; se ocupada, `listenAvailable` tenta as portas seguintes. */
const FIRST_PORT = 3000;

const { app, logger } = buildApplication();

const { port } = await app.listenAvailable(HOST, FIRST_PORT);
printServerReady(port, HOST);
logger.log("info", "server_listening", { port, host: HOST });

let shutdownStarted = false;

/**
 * Encerra o servidor HTTP e o processo. Nova chamada após início do shutdown encerra com código 1.
 * @param signal - Sinal POSIX recebido (ex.: `SIGTERM`).
 */
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

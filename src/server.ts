import process from "node:process";
import { buildApplication } from "./app.js";
import { printServerReady } from "./platform/logging/print-server-ready.js";
import type { HttpServerApp } from "./platform/http/http-server.js";

/** Bind em todas as interfaces (acesso local via `localhost` ou IP da máquina). */
const HOST = "0.0.0.0";

/** Porta inicial quando `PORT` não está definida; `listenAvailable` tenta as seguintes se ocupada. */
const DEFAULT_START_PORT = 3000;

function parsePort(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new Error(`PORT inválida: ${raw}`);
  }
  return n;
}

async function bindHttpApp(app: HttpServerApp): Promise<{ port: number }> {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") {
    return app.listenAvailable(HOST, DEFAULT_START_PORT);
  }
  return app.listen(parsePort(raw), HOST);
}

const { app, logger } = buildApplication();

const { port } = await bindHttpApp(app);
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

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../logging/logger.dto.js";

/** Handler de rota com contexto de observabilidade por requisição. */
export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  context: { requestId: string; logger: Logger },
) => void | Promise<void>;

export type HttpServerApp = {
  listen(port: number, host: string): Promise<{ port: number }>;
  /**
   * Escuta em `startPort`, depois `startPort + 1`, até porta livre ou limite de tentativas.
   * @param host - Host do bind (ex.: `0.0.0.0`).
   * @param startPort - Primeira porta a tentar.
   */
  listenAvailable(host: string, startPort: number): Promise<{ port: number }>;
  close(): Promise<void>;
};

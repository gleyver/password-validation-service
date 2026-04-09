import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../logging/logger.dto.js";

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  context: { requestId: string; logger: Logger },
) => void | Promise<void>;

export type HttpServerApp = {
  listen(port: number, host: string): Promise<{ port: number }>;
  /**
   * Tenta `startPort`, depois `startPort+1`, … até encontrar porta livre ou esgotar tentativas.
   */
  listenAvailable(host: string, startPort: number): Promise<{ port: number }>;
  close(): Promise<void>;
};

import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { newRequestId, type Logger } from "../logging/logger.js";

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

type Route = {
  method: string;
  path: string;
  handler: RouteHandler;
};

function parseUrlPath(url: string): string {
  const q = url.indexOf("?");
  if (q === -1) {
    return url;
  }
  return url.slice(0, q);
}

export function createHttpApp(options: {
  logger: Logger;
  routes: Route[];
}): HttpServerApp {
  let server: Server;
  const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    const headerId = req.headers["x-request-id"];
    const requestId =
      typeof headerId === "string" && headerId.length > 0
        ? headerId
        : newRequestId();
    const logger = options.logger.child({ requestId });
    res.setHeader("X-Request-Id", requestId);
    const method = req.method ?? "GET";
    const path = parseUrlPath(req.url ?? "/");
    const match = options.routes.find(
      (r) => r.method === method && r.path === path,
    );
    if (!match) {
      logger.log("warn", "http_route_not_found", { method, path });
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }
    try {
      await match.handler(req, res, { requestId, logger });
    } catch (err) {
      logger.log("error", "http_unhandled_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "internal_error" }));
      }
    }
  };

  server = createServer(
    (req: IncomingMessage, res: ServerResponse): void => {
      void handleRequest(req, res);
    },
  );

  function listenOnce(port: number, host: string): Promise<{ port: number }> {
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => {
        server.off("error", reject);
        const addr = server.address();
        const resolvedPort =
          typeof addr === "object" && addr !== null ? addr.port : port;
        resolve({ port: resolvedPort });
      });
    });
  }

  const MAX_PORT_ATTEMPTS = 10_000;

  return {
    listen(port: number, host: string): Promise<{ port: number }> {
      return listenOnce(port, host);
    },
    async listenAvailable(
      host: string,
      startPort: number,
    ): Promise<{ port: number }> {
      for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
        const port = startPort + i;
        try {
          return await listenOnce(port, host);
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code;
          if (code === "EADDRINUSE") {
            continue;
          }
          throw err;
        }
      }
      throw new Error(
        `Nenhuma porta livre entre ${startPort} e ${startPort + MAX_PORT_ATTEMPTS - 1}`,
      );
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
        server.close((e) => (e ? reject(e) : resolve()));
      });
    },
  };
}

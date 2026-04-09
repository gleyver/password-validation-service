import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { request } from "node:http";
import { describe, it, before, after } from "node:test";
import { createHttpApp } from "./http-server.js";
import { createLogger } from "../logging/logger.js";

function httpGet(
  port: number,
  path: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: "127.0.0.1", port, path, method: "GET" },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("createHttpApp", () => {
  let port = 0;
  const app = createHttpApp({
    logger: createLogger({ service: "http-test" }),
    routes: [
      {
        method: "GET",
        path: "/ping",
        handler: (_req, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("pong");
        },
      },
      {
        method: "GET",
        path: "/boom",
        handler: () => {
          throw new Error("handler_fail");
        },
      },
    ],
  });

  before(async () => {
    const { port: p } = await app.listen(0, "127.0.0.1");
    port = p;
  });

  after(async () => {
    await app.close();
  });

  it("ignora query string ao casar rota", async () => {
    const { status, body } = await httpGet(port, "/ping?x=1");
    assert.equal(status, 200);
    assert.equal(body, "pong");
  });

  it("retorna 404 com JSON para rota inexistente", async () => {
    const { status, body } = await httpGet(port, "/inexistente");
    assert.equal(status, 404);
    assert.deepEqual(JSON.parse(body), { error: "not_found" });
  });

  it("retorna 500 quando handler lança", async () => {
    const { status, body } = await httpGet(port, "/boom");
    assert.equal(status, 500);
    assert.deepEqual(JSON.parse(body), { error: "internal_error" });
  });
});

describe("listenAvailable", () => {
  const logger = createLogger({ service: "listen-available-test" });
  const pingRoute = {
    method: "GET" as const,
    path: "/ping",
    handler: (_req: IncomingMessage, res: ServerResponse) => {
      res.statusCode = 200;
      res.end("ok");
    },
  };

  it("avança para a próxima porta se a inicial estiver em uso", async () => {
    const basePort = 45_678;
    const first = createHttpApp({ logger, routes: [pingRoute] });
    const second = createHttpApp({ logger, routes: [pingRoute] });
    const { port: taken } = await first.listenAvailable("127.0.0.1", basePort);
    const { port: next } = await second.listenAvailable("127.0.0.1", basePort);
    assert.equal(taken, basePort);
    assert.equal(next, basePort + 1);
    await first.close();
    await second.close();
  });
});

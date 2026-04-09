import assert from "node:assert/strict";
import { request } from "node:http";
import { describe, it, before, after } from "node:test";
import { buildApplication } from "./app.js";

function postJson(
  port: number,
  path: string,
  body: unknown,
): Promise<{ status: number; headers: NodeJS.Dict<string | string[]>; json: unknown }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json: unknown;
          try {
            json = JSON.parse(text) as unknown;
          } catch {
            json = text;
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            json,
          });
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function postRaw(
  port: number,
  path: string,
  rawBody: string,
): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(rawBody),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown = null;
          if (text.length > 0) {
            try {
              parsed = JSON.parse(text) as unknown;
            } catch {
              parsed = text;
            }
          }
          resolve({
            status: res.statusCode ?? 0,
            json: parsed,
          });
        });
      },
    );
    req.on("error", reject);
    req.write(rawBody);
    req.end();
  });
}

describe("HTTP integration", () => {
  let port = 0;
  const { app } = buildApplication();

  before(async () => {
    const { port: p } = await app.listen(0, "127.0.0.1");
    port = p;
  });

  after(async () => {
    await app.close();
  });

  it("GET /health retorna ok", async () => {
    const res = await new Promise<number>((resolve, reject) => {
      const req = request(
        { hostname: "127.0.0.1", port, path: "/health", method: "GET" },
        (r) => {
          resolve(r.statusCode ?? 0);
        },
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(res, 200);
  });

  it("GET /health com query string continua 200", async () => {
    const res = await new Promise<number>((resolve, reject) => {
      const req = request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/health?probe=1",
          method: "GET",
        },
        (r) => resolve(r.statusCode ?? 0),
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(res, 200);
  });

  it("GET rota inexistente retorna 404", async () => {
    const res = await new Promise<number>((resolve, reject) => {
      const req = request(
        { hostname: "127.0.0.1", port, path: "/nada", method: "GET" },
        (r) => resolve(r.statusCode ?? 0),
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(res, 404);
  });

  it("POST validação retorna valid true", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "Ab1!cdefgh",
    });
    assert.equal(status, 200);
    assert.deepEqual(json, { valid: true });
  });

  it("POST validação retorna valid false", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "weak",
    });
    assert.equal(status, 200);
    assert.deepEqual(json, { valid: false });
  });

  it("includeAssistantHints retorna dicas determinísticas", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "weak",
      includeAssistantHints: true,
    });
    assert.equal(status, 200);
    assert.ok(json && typeof json === "object");
    const body = json as { valid: boolean; assistantHints?: string[] };
    assert.equal(body.valid, false);
    assert.ok(Array.isArray(body.assistantHints));
    assert.ok((body.assistantHints?.length ?? 0) > 0);
  });

  it("includeAssistantHints inclui dica de caracteres repetidos quando aplicável", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "Ab1!cdeffh",
      includeAssistantHints: true,
    });
    assert.equal(status, 200);
    const body = json as { valid: boolean; assistantHints?: string[] };
    assert.equal(body.valid, false);
    const joined = (body.assistantHints ?? []).join(" ");
    assert.ok(
      joined.includes("repetidos"),
      `esperava menção a repetidos, recebido: ${joined}`,
    );
  });

  it("senha válida com includeAssistantHints retorna dicas de sucesso", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "Ab1!cdefgh",
      includeAssistantHints: true,
    });
    assert.equal(status, 200);
    const body = json as { valid: boolean; assistantHints?: string[] };
    assert.equal(body.valid, true);
    assert.ok(body.assistantHints?.[0].includes("regras"));
  });

  it("rejeita password ausente ou vazio", async () => {
    const a = await postJson(port, "/v1/password-validations", {});
    assert.equal(a.status, 400);
    assert.deepEqual(a.json, { error: "invalid_password_field" });

    const b = await postJson(port, "/v1/password-validations", {
      password: "",
    });
    assert.equal(b.status, 400);
    assert.deepEqual(b.json, { error: "invalid_password_field" });

    const c = await postJson(port, "/v1/password-validations", {
      password: 123,
    });
    assert.equal(c.status, 400);
    assert.deepEqual(c.json, { error: "invalid_password_field" });
  });

  it("rejeita corpo vazio", async () => {
    const { status, json } = await postRaw(port, "/v1/password-validations", "");
    assert.equal(status, 400);
    assert.deepEqual(json, { error: "empty_body" });
  });

  it("rejeita corpo acima do limite", async () => {
    const filler = "a".repeat(20_000);
    const raw = JSON.stringify({ password: filler });
    const { status, json } = await postRaw(
      port,
      "/v1/password-validations",
      raw,
    );
    assert.equal(status, 413);
    assert.deepEqual(json, { error: "payload_too_large" });
  });

  it("rejeita JSON inválido", async () => {
    const { status } = await new Promise<{ status: number }>((resolve, reject) => {
      const req = request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/v1/password-validations",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (r) => resolve({ status: r.statusCode ?? 0 }),
      );
      req.on("error", reject);
      req.write("{");
      req.end();
    });
    assert.equal(status, 400);
  });

  it("propaga X-Request-Id na resposta", async () => {
    const { headers } = await new Promise<{
      headers: NodeJS.Dict<string | string[]>;
    }>((resolve, reject) => {
      const req = request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/v1/password-validations",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": "custom-req",
          },
        },
        (r) => {
          resolve({ headers: r.headers });
        },
      );
      req.on("error", reject);
      req.write(JSON.stringify({ password: "Ab1!cdefgh" }));
      req.end();
    });
    assert.equal(headers["x-request-id"], "custom-req");
  });
});

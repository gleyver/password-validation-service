import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";
import { describe, it } from "node:test";
import { Readable } from "node:stream";
import { readJsonBody } from "./json-body.js";

function asRequest(chunks: (Buffer | string)[]): IncomingMessage {
  const buffers = chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c)));
  return Readable.from(buffers) as IncomingMessage;
}

describe("readJsonBody", () => {
  it("retorna objeto parseado", async () => {
    const r = await readJsonBody(asRequest([Buffer.from('{"x":1}')]));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value, { x: 1 });
    }
  });

  it("aceita chunk como string (Buffer.from)", async () => {
    const r = await readJsonBody(asRequest(['{"a":"b"}']));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value, { a: "b" });
    }
  });

  it("retorna invalid_json", async () => {
    const r = await readJsonBody(asRequest([Buffer.from("not json")]));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error, "invalid_json");
    }
  });

  it("retorna empty_body sem chunks", async () => {
    const r = await readJsonBody(asRequest([]));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error, "empty_body");
    }
  });

  it("retorna empty_body quando só whitespace", async () => {
    const r = await readJsonBody(asRequest([Buffer.from("  \n\t  ")]));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error, "empty_body");
    }
  });

  it("retorna payload_too_large respeitando limite", async () => {
    const r = await readJsonBody(asRequest([Buffer.alloc(50), Buffer.alloc(60)]), 100);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error, "payload_too_large");
    }
  });

  it("agrega múltiplos buffers", async () => {
    const r = await readJsonBody(
      asRequest([Buffer.from('{"p":'), Buffer.from('"ok"}')]),
    );
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value, { p: "ok" });
    }
  });
});

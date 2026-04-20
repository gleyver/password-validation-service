import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ServerResponse } from "node:http";
import { HTTP_JSON_STATIC, writeJsonResponse, writeJsonUtf8 } from "./write-json-response.js";

function mockResponse(): {
  res: ServerResponse;
  captured: { statusCode: number; contentType: string; body: string };
} {
  const captured = { statusCode: 0, contentType: "", body: "" };
  const res = {
    set statusCode(v: number) {
      captured.statusCode = v;
    },
    setHeader(name: string, value: string): void {
      if (name === "Content-Type") {
        captured.contentType = value;
      }
    },
    end(chunk: string): void {
      captured.body = chunk;
    },
  };
  return { res: res as unknown as ServerResponse, captured };
}

describe("writeJsonResponse", () => {
  it("define status, Content-Type JSON UTF-8 e corpo JSON", () => {
    const { res, captured } = mockResponse();
    writeJsonResponse(res, 201, { id: "x" });
    assert.equal(captured.statusCode, 201);
    assert.equal(captured.contentType, "application/json; charset=utf-8");
    assert.deepEqual(JSON.parse(captured.body), { id: "x" });
  });

  it("writeJsonUtf8 envia corpo pré-serializado", () => {
    const { res, captured } = mockResponse();
    writeJsonUtf8(res, 404, HTTP_JSON_STATIC.errorNotFound);
    assert.equal(captured.statusCode, 404);
    assert.deepEqual(JSON.parse(captured.body), { error: "not_found" });
  });
});

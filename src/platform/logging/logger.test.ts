import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { createLogger, newRequestId } from "./logger.js";

const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);

describe("createLogger", () => {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  beforeEach(() => {
    stdoutLines.length = 0;
    stderrLines.length = 0;
    process.stdout.write = ((chunk: string | Uint8Array): boolean => {
      const s =
        typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      stdoutLines.push(s);
      return true;
    }) as typeof process.stdout.write;

    process.stderr.write = ((chunk: string | Uint8Array): boolean => {
      const s =
        typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      stderrLines.push(s);
      return true;
    }) as typeof process.stderr.write;
  });

  afterEach(() => {
    process.stdout.write = origStdoutWrite;
    process.stderr.write = origStderrWrite;
  });

  it("escreve info em stdout", () => {
    const log = createLogger({ svc: "t" });
    log.log("info", "hello", { n: 1 });
    assert.equal(stdoutLines.length, 1);
    const row = JSON.parse(stdoutLines[0]) as { level: string; msg: string; n: number };
    assert.equal(row.level, "info");
    assert.equal(row.msg, "hello");
    assert.equal(row.n, 1);
  });

  it("escreve error em stderr", () => {
    const log = createLogger({});
    log.log("error", "oops");
    assert.equal(stderrLines.length, 1);
    const row = JSON.parse(stderrLines[0]) as { level: string; msg: string };
    assert.equal(row.level, "error");
    assert.equal(row.msg, "oops");
  });

  it("child mescla campos", () => {
    const log = createLogger({ a: 1 }).child({ b: 2 });
    log.log("warn", "x");
    const row = JSON.parse(stdoutLines[0]) as { a: number; b: number; level: string };
    assert.equal(row.a, 1);
    assert.equal(row.b, 2);
    assert.equal(row.level, "warn");
  });
});

describe("newRequestId", () => {
  it("retorna UUID v4", () => {
    const id = newRequestId();
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});

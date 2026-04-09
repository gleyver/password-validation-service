import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApplication } from "./app.js";
import { createLogger } from "./platform/logging/logger.js";

describe("buildApplication", () => {
  it("cria logger padrão quando omitido", () => {
    const { logger } = buildApplication();
    assert.equal(typeof logger.log, "function");
    assert.equal(typeof logger.child, "function");
  });

  it("reutiliza logger injetado", () => {
    const custom = createLogger({ unit: "test-app" });
    const { logger } = buildApplication({ logger: custom });
    assert.strictEqual(logger, custom);
  });
});

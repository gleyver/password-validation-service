import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePasswordRequestBodySchema } from "./validate-password-body.schema.js";

describe("validatePasswordRequestBodySchema", () => {
  it("aceita senha não vazia e trata includeAssistantHints só com JSON true", () => {
    const a = validatePasswordRequestBodySchema.safeParse({
      password: "x",
    });
    assert.equal(a.success, true);
    if (a.success) {
      assert.equal(a.data.includeAssistantHints, false);
    }

    const b = validatePasswordRequestBodySchema.safeParse({
      password: "x",
      includeAssistantHints: true,
    });
    assert.equal(b.success, true);
    if (b.success) {
      assert.equal(b.data.includeAssistantHints, true);
    }

    const c = validatePasswordRequestBodySchema.safeParse({
      password: "x",
      includeAssistantHints: false,
    });
    assert.equal(c.success, true);
    if (c.success) {
      assert.equal(c.data.includeAssistantHints, false);
    }

    const d = validatePasswordRequestBodySchema.safeParse({
      password: "x",
      includeAssistantHints: "yes",
    });
    assert.equal(d.success, true);
    if (d.success) {
      assert.equal(d.data.includeAssistantHints, false);
    }
  });

  it("rejeita password ausente, vazio ou não string", () => {
    assert.equal(
      validatePasswordRequestBodySchema.safeParse({}).success,
      false,
    );
    assert.equal(
      validatePasswordRequestBodySchema.safeParse({ password: "" }).success,
      false,
    );
    assert.equal(
      validatePasswordRequestBodySchema.safeParse({ password: 123 }).success,
      false,
    );
  });
});

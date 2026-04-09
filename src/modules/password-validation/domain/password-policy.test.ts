import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_SPECIALS,
  MAX_PASSWORD_LENGTH,
  MIN_LENGTH,
} from "./password-policy.js";

describe("password-policy", () => {
  it("exporta constantes esperadas", () => {
    assert.equal(MIN_LENGTH, 9);
    assert.equal(MAX_PASSWORD_LENGTH, 256);
    assert.ok(ALLOWED_SPECIALS.includes("!"));
    assert.ok(ALLOWED_SPECIALS.length > 0);
  });
});

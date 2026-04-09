import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PasswordFailureReason } from "../domain/password-failure-reason.js";
import { DeterministicPasswordAssistant } from "./deterministic-password-assistant.js";

describe("DeterministicPasswordAssistant", () => {
  const assistant = new DeterministicPasswordAssistant();

  it("com lista vazia de motivos retorna mensagem de sucesso", async () => {
    const hints = await assistant.enrichWithHints("x", []);
    assert.equal(hints.length, 1);
    assert.ok(hints[0].includes("regras"));
  });

  it("mapeia todo valor de PasswordFailureReason para mensagem não vazia", async () => {
    const allReasons = Object.values(
      PasswordFailureReason,
    ) as PasswordFailureReason[];
    for (const reason of allReasons) {
      const hints = await assistant.enrichWithHints("x", [reason]);
      assert.equal(hints.length, 1);
      assert.ok(hints[0].trim().length > 0);
    }
  });

  it("mapeia código conhecido", async () => {
    const hints = await assistant.enrichWithHints("x", [
      PasswordFailureReason.FaltaDigito,
    ]);
    assert.equal(hints.length, 1);
    assert.ok(hints[0].includes("dígito"));
  });
});

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

  it("mapeia código desconhecido para mensagem genérica", async () => {
    const hints = await assistant.enrichWithHints("x", [
      "codigo_futuro_xyz" as PasswordFailureReason,
    ]);
    assert.equal(hints.length, 1);
    assert.ok(hints[0].includes("codigo_futuro_xyz"));
    assert.ok(hints[0].includes("Regra não atendida"));
  });

  it("mapeia código conhecido", async () => {
    const hints = await assistant.enrichWithHints("x", [
      PasswordFailureReason.FaltaDigito,
    ]);
    assert.equal(hints.length, 1);
    assert.ok(hints[0].includes("dígito"));
  });
});

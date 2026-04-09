import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_PASSWORD_LENGTH } from "./password-policy.js";
import { validatePasswordPolicy } from "./password-validator.js";

describe("validatePasswordPolicy", () => {
  it("aceita senha que cumpre todas as regras", () => {
    const r = validatePasswordPolicy("Ab1!cdefgh");
    assert.equal(r.valid, true);
  });

  it("rejeita menos de 9 caracteres", () => {
    const r = validatePasswordPolicy("Ab1!cdef");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.some((x) => x.startsWith("comprimento_mínimo")));
    }
  });

  it("rejeita sem dígito", () => {
    const r = validatePasswordPolicy("Abcdef!ghi");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("falta_dígito"));
    }
  });

  it("rejeita sem minúscula", () => {
    const r = validatePasswordPolicy("AB1!CDEFGH");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("falta_letra_minúscula"));
    }
  });

  it("rejeita sem maiúscula", () => {
    const r = validatePasswordPolicy("ab1!cdefgh");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("falta_letra_maiúscula"));
    }
  });

  it("rejeita sem especial permitido", () => {
    const r = validatePasswordPolicy("Ab1cdefghi");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("falta_caractere_especial_permitido"));
    }
  });

  it("rejeita caracteres repetidos", () => {
    const r = validatePasswordPolicy("Ab1!cdeffa");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("caracteres_repetidos"));
    }
  });

  it("rejeita espaço em branco", () => {
    const r = validatePasswordPolicy("Ab1!cdef h");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("espaço_em_branco_não_permitido"));
    }
  });

  it("rejeita acima do tamanho máximo", () => {
    const base = "a".repeat(MAX_PASSWORD_LENGTH + 1);
    const r = validatePasswordPolicy(base);
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes("senha_excede_tamanho_máximo"));
    }
  });
});

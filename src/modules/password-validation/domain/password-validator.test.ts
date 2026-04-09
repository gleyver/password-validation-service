import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PasswordFailureReason } from "./password-failure-reason.js";
import {
  ALLOWED_SPECIALS,
  MIN_LENGTH,
  validatePasswordPolicy,
} from "./password-validator.js";

describe("política exportada (constantes)", () => {
  it("exporta MIN_LENGTH e ALLOWED_SPECIALS esperados", () => {
    assert.equal(MIN_LENGTH, 9);
    assert.ok(ALLOWED_SPECIALS.includes("!"));
    assert.ok(ALLOWED_SPECIALS.length > 0);
  });
});

describe("validatePasswordPolicy", () => {
  it("aceita senha que cumpre todas as regras", () => {
    const r = validatePasswordPolicy("Ab1!cdefgh");
    assert.equal(r.valid, true);
  });

  it("rejeita menos de 9 caracteres", () => {
    const r = validatePasswordPolicy("Ab1!cdef");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.FaltaComprimentoMinimo));
    }
  });

  it("rejeita sem dígito", () => {
    const r = validatePasswordPolicy("Abcdef!ghi");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.FaltaDigito));
    }
  });

  it("rejeita sem minúscula", () => {
    const r = validatePasswordPolicy("AB1!CDEFGH");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.FaltaLetraMinuscula));
    }
  });

  it("rejeita sem maiúscula", () => {
    const r = validatePasswordPolicy("ab1!cdefgh");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.FaltaLetraMaiuscula));
    }
  });

  it("rejeita sem especial permitido", () => {
    const r = validatePasswordPolicy("Ab1cdefghi");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(
        r.reasons.includes(PasswordFailureReason.FaltaCaractereEspecialPermitido),
      );
    }
  });

  it("rejeita caracteres repetidos", () => {
    const r = validatePasswordPolicy("Ab1!cdeffa");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.CaracteresRepetidos));
    }
  });

  it("rejeita espaço em branco", () => {
    const r = validatePasswordPolicy("Ab1!cdef h");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(
        r.reasons.includes(PasswordFailureReason.EspacoEmBrancoNaoPermitido),
      );
    }
  });
});

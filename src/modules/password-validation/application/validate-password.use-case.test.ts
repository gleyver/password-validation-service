import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { PasswordFailureReason } from "../domain/password-failure-reason.js";
import { validatePasswordPolicy } from "../domain/password-validator.js";
import { ValidatePasswordUseCase } from "./validate-password.use-case.js";

class FakeAssistant implements PasswordAssistantPort {
  async enrichWithHints(
    _password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]> {
    return reasonsWhenInvalid.length === 0 ? ["ok"] : ["hint"];
  }
}

/** Registra argumentos e devolve dicas derivadas dos motivos (para asserts explícitos). */
class RecordingAssistant implements PasswordAssistantPort {
  readonly calls: Array<{
    password: string;
    reasons: readonly PasswordFailureReason[];
  }> = [];

  async enrichWithHints(
    password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]> {
    this.calls.push({ password, reasons: reasonsWhenInvalid });
    if (reasonsWhenInvalid.length === 0) {
      return ["assinatura-sucesso"];
    }
    return reasonsWhenInvalid.map((r) => `hint:${r}`);
  }
}

class NeverCalledAssistant implements PasswordAssistantPort {
  calls = 0;

  async enrichWithHints(): Promise<readonly string[]> {
    this.calls++;
    return [];
  }
}

describe("ValidatePasswordUseCase", () => {
  describe("includeAssistantHints: false", () => {
    it("retorna apenas { valid: true } quando a senha atende a política", async () => {
      const uc = new ValidatePasswordUseCase(new FakeAssistant());
      const out = await uc.execute({
        password: "Ab1!cdefgh",
        includeAssistantHints: false,
      });
      assert.deepEqual(out, { valid: true });
    });

    it("retorna apenas { valid: false } quando a senha falha na política", async () => {
      const uc = new ValidatePasswordUseCase(new FakeAssistant());
      const out = await uc.execute({
        password: "weak",
        includeAssistantHints: false,
      });
      assert.deepEqual(out, { valid: false });
    });

    it("não chama o assistente (porta)", async () => {
      const assistant = new NeverCalledAssistant();
      const uc = new ValidatePasswordUseCase(assistant);
      await uc.execute({
        password: "Ab1!cdefgh",
        includeAssistantHints: false,
      });
      await uc.execute({
        password: "weak",
        includeAssistantHints: false,
      });
      assert.equal(assistant.calls, 0);
    });

    it("não inclui assistantHints na resposta", async () => {
      const out = await new ValidatePasswordUseCase(new FakeAssistant()).execute({
        password: "Ab1!cdefgh",
        includeAssistantHints: false,
      });
      assert.equal("assistantHints" in out, false);
    });
  });

  describe("includeAssistantHints: true", () => {
    it("inclui dicas quando a senha é válida (motivos vazios na porta)", async () => {
      const uc = new ValidatePasswordUseCase(new FakeAssistant());
      const out = await uc.execute({
        password: "Ab1!cdefgh",
        includeAssistantHints: true,
      });
      assert.equal(out.valid, true);
      assert.deepEqual(out.assistantHints, ["ok"]);
    });

    it("inclui dicas quando a senha é inválida", async () => {
      const uc = new ValidatePasswordUseCase(new FakeAssistant());
      const out = await uc.execute({
        password: "short",
        includeAssistantHints: true,
      });
      assert.equal(out.valid, false);
      assert.deepEqual(out.assistantHints, ["hint"]);
    });

    it("repassa à porta exatamente os motivos retornados pela política", async () => {
      const password = "weak";
      const policy = validatePasswordPolicy(password);
      assert.equal(policy.valid, false);

      const assistant = new RecordingAssistant();
      const uc = new ValidatePasswordUseCase(assistant);
      const out = await uc.execute({
        password,
        includeAssistantHints: true,
      });

      assert.equal(assistant.calls.length, 1);
      assert.equal(assistant.calls[0]?.password, password);
      assert.deepEqual(assistant.calls[0]?.reasons, policy.reasons);
      assert.equal(out.valid, false);
      assert.deepEqual(
        out.assistantHints,
        policy.reasons.map((r) => `hint:${r}`),
      );
    });

    it("repassa lista vazia de motivos quando válida e pede dicas", async () => {
      const assistant = new RecordingAssistant();
      await new ValidatePasswordUseCase(assistant).execute({
        password: "Ab1!cdefgh",
        includeAssistantHints: true,
      });

      assert.deepEqual(assistant.calls[0]?.reasons, []);
    });

    it("propaga a mesma string de senha recebida pelo caso de uso para a porta", async () => {
      const pwd = "Ab1!cdeffh";
      const assistant = new RecordingAssistant();
      await new ValidatePasswordUseCase(assistant).execute({
        password: pwd,
        includeAssistantHints: true,
      });
      assert.equal(assistant.calls[0]?.password, pwd);
    });
  });

  describe("alinhamento com cenários de política (motivos esperados)", () => {
    const cases: Array<{ label: string; password: string; expectReason: PasswordFailureReason }> =
      [
        {
          label: "sem minúscula",
          password: "AB1!CDEFGH",
          expectReason: PasswordFailureReason.FaltaLetraMinuscula,
        },
        {
          label: "sem maiúscula",
          password: "ab1!cdefgh",
          expectReason: PasswordFailureReason.FaltaLetraMaiuscula,
        },
        {
          label: "sem dígito",
          password: "Abcdef!ghi",
          expectReason: PasswordFailureReason.FaltaDigito,
        },
        {
          label: "sem especial permitido",
          password: "Ab1cdefghi",
          expectReason: PasswordFailureReason.FaltaCaractereEspecialPermitido,
        },
        {
          label: "caracteres repetidos",
          password: "Ab1!cdeffa",
          expectReason: PasswordFailureReason.CaracteresRepetidos,
        },
        {
          label: "espaço em branco",
          password: "Ab1!cdef h",
          expectReason: PasswordFailureReason.EspacoEmBrancoNaoPermitido,
        },
      ];

    for (const { label, password, expectReason } of cases) {
      it(`inclui motivo ${expectReason} — ${label}`, async () => {
        const policy = validatePasswordPolicy(password);
        assert.equal(policy.valid, false);
        assert.ok(
          policy.reasons.includes(expectReason),
          `política deveria incluir ${expectReason}, obtido: ${policy.reasons.join(",")}`,
        );

        const assistant = new RecordingAssistant();
        await new ValidatePasswordUseCase(assistant).execute({
          password,
          includeAssistantHints: true,
        });

        assert.ok(assistant.calls[0]?.reasons.includes(expectReason));
        assert.deepEqual(assistant.calls[0]?.reasons, policy.reasons);
      });
    }

    it("senha curta inclui falta de comprimento mínimo entre os motivos", async () => {
      const password = "Ab1!cd";
      const policy = validatePasswordPolicy(password);
      assert.ok(policy.valid === false);
      assert.ok(policy.reasons.includes(PasswordFailureReason.FaltaComprimentoMinimo));

      const assistant = new RecordingAssistant();
      await new ValidatePasswordUseCase(assistant).execute({
        password,
        includeAssistantHints: true,
      });
      assert.deepEqual(assistant.calls[0]?.reasons, policy.reasons);
    });

    it("falha com vários motivos repassa todos em ordem para o assistente", async () => {
      const password = "weak";
      const expected = validatePasswordPolicy(password);
      assert.equal(expected.valid, false);
      assert.ok(
        (expected.reasons?.length ?? 0) > 1,
        "fixture deve acionar mais de um motivo para este teste",
      );

      const assistant = new RecordingAssistant();
      await new ValidatePasswordUseCase(assistant).execute({
        password,
        includeAssistantHints: true,
      });
      assert.deepEqual(assistant.calls[0]?.reasons, expected.reasons);
    });
  });
});

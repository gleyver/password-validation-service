import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { ValidatePasswordUseCase } from "./validate-password.use-case.js";

class FakeAssistant implements PasswordAssistantPort {
  async enrichWithHints(
    _password: string,
    reasonsWhenInvalid: readonly string[],
  ): Promise<readonly string[]> {
    return reasonsWhenInvalid.length === 0 ? ["ok"] : ["hint"];
  }
}

describe("ValidatePasswordUseCase", () => {
  it("retorna apenas valid quando hints desligados", async () => {
    const uc = new ValidatePasswordUseCase(new FakeAssistant());
    const out = await uc.execute({
      password: "Ab1!cdefgh",
      includeAssistantHints: false,
    });
    assert.deepEqual(out, { valid: true });
  });

  it("inclui hints quando solicitado e senha válida", async () => {
    const uc = new ValidatePasswordUseCase(new FakeAssistant());
    const out = await uc.execute({
      password: "Ab1!cdefgh",
      includeAssistantHints: true,
    });
    assert.equal(out.valid, true);
    assert.deepEqual(out.assistantHints, ["ok"]);
  });

  it("inclui hints quando solicitado e senha inválida", async () => {
    const uc = new ValidatePasswordUseCase(new FakeAssistant());
    const out = await uc.execute({
      password: "short",
      includeAssistantHints: true,
    });
    assert.equal(out.valid, false);
    assert.deepEqual(out.assistantHints, ["hint"]);
  });
});

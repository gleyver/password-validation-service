import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { validatePasswordPolicy } from "../domain/password-validator.js";
import type {
  ValidatePasswordInput,
  ValidatePasswordOutput,
} from "./validate-password.dto.js";

/**
 * Aplica a política de senha e, se solicitado, obtém dicas via {@link PasswordAssistantPort}.
 */
export class ValidatePasswordUseCase {
  constructor(private readonly assistant: PasswordAssistantPort) {}

  /**
   * @param input - Senha e flag de dicas (já validados na borda HTTP).
   * @returns Resultado com `assistantHints` apenas quando `includeAssistantHints` é `true`.
   */
  async execute(
    input: ValidatePasswordInput,
  ): Promise<ValidatePasswordOutput> {
    const result = validatePasswordPolicy(input.password);
    if (!input.includeAssistantHints) {
      return { valid: result.valid };
    }
    const reasonsWhenInvalid = result.valid ? [] : result.reasons;
    const assistantHints = await this.assistant.enrichWithHints(
      input.password,
      reasonsWhenInvalid,
    );
    return { valid: result.valid, assistantHints };
  }
}

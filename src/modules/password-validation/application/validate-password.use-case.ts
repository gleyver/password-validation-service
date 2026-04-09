import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { validatePasswordPolicy } from "../domain/password-validator.js";
import type {
  ValidatePasswordInput,
  ValidatePasswordOutput,
} from "./validate-password.dto.js";

export class ValidatePasswordUseCase {
  constructor(private readonly assistant: PasswordAssistantPort) {}

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

import { ValidatePasswordUseCase } from "./modules/password-validation/application/validate-password.use-case.js";
import { DeterministicPasswordAssistant } from "./modules/password-validation/infrastructure/deterministic-password-assistant.js";

export function createValidatePasswordUseCase(): ValidatePasswordUseCase {
  return new ValidatePasswordUseCase(new DeterministicPasswordAssistant());
}

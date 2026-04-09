import { ValidatePasswordUseCase } from "./modules/password-validation/application/validate-password.use-case.js";
import { DeterministicPasswordAssistant } from "./modules/password-validation/infrastructure/deterministic-password-assistant.js";

/**
 * Instancia o caso de uso de validação com o assistente determinístico padrão.
 * @returns Caso de uso pronto para injeção no handler HTTP.
 */
export function createValidatePasswordUseCase(): ValidatePasswordUseCase {
  return new ValidatePasswordUseCase(new DeterministicPasswordAssistant());
}

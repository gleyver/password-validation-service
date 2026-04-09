import type { PasswordFailureReason } from "../password-failure-reason.js";

/**
 * Porta de saída para mensagens assistivas (dicas) alinhadas ao resultado da validação.
 * Implementação padrão é determinística e permanece no processo.
 */
export interface PasswordAssistantPort {
  enrichWithHints(
    password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]>;
}

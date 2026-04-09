/**
 * Porta de saída para mensagens assistivas (dicas) alinhadas ao resultado da validação.
 * Implementação padrão é determinística e permanece no processo.
 */
export interface PasswordAssistantPort {
  enrichWithHints(
    password: string,
    reasonsWhenInvalid: readonly string[],
  ): Promise<readonly string[]>;
}

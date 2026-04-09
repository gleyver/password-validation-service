import type { PasswordFailureReason } from "../password-failure-reason.js";

/**
 * Porta para enriquecer o resultado da validação com mensagens de ajuda ao usuário.
 */
export interface PasswordAssistantPort {
  /**
   * @param password - Senha validada (útil para implementações que personalizam por conteúdo).
   * @param reasonsWhenInvalid - Motivos quando inválida; vazio quando válida com pedido de dicas.
   * @returns Mensagens de ajuda na ordem dos motivos, ou confirmação quando válida com dicas.
   */
  enrichWithHints(
    password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]>;
}

import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { PasswordFailureReason } from "../domain/password-failure-reason.js";
import {
  ALLOWED_SPECIALS,
  MIN_LENGTH,
} from "../domain/password-validator.js";

const REASON_MESSAGES: Record<PasswordFailureReason, string> = {
  [PasswordFailureReason.FaltaComprimentoMinimo]: `Use pelo menos ${MIN_LENGTH} caracteres.`,
  [PasswordFailureReason.FaltaDigito]: "Inclua ao menos um dígito (0-9).",
  [PasswordFailureReason.FaltaLetraMinuscula]:
    "Inclua ao menos uma letra minúscula (a-z).",
  [PasswordFailureReason.FaltaLetraMaiuscula]:
    "Inclua ao menos uma letra maiúscula (A-Z).",
  [PasswordFailureReason.FaltaCaractereEspecialPermitido]: `Inclua ao menos um destes especiais: ${ALLOWED_SPECIALS}`,
  [PasswordFailureReason.CaracteresRepetidos]:
    "Não possua caracteres repetidos: no conjunto da senha, cada caractere deve aparecer apenas uma vez.",
  [PasswordFailureReason.EspacoEmBrancoNaoPermitido]: "Remova espaços em branco.",
};

function messageForReason(reason: PasswordFailureReason): string {
  return REASON_MESSAGES[reason];
}

/**
 * Implementação de {@link PasswordAssistantPort} sem chamadas externas: mapeia motivos em mensagens de ajuda.
 */
export class DeterministicPasswordAssistant implements PasswordAssistantPort {
  /**
   * @param _password - Senha validada (não usada nesta implementação).
   * @param reasonsWhenInvalid - Vazio quando a senha é válida e o cliente pediu dicas (mensagem de sucesso).
   * @returns Dicas na ordem dos motivos ou uma linha confirmando que a política foi atendida.
   */
  enrichWithHints(
    _password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]> {
    if (reasonsWhenInvalid.length === 0) {
      return Promise.resolve([
        "Senha atende a todas as regras configuradas nesta API.",
      ]);
    }
    return Promise.resolve(reasonsWhenInvalid.map(messageForReason));
  }
}

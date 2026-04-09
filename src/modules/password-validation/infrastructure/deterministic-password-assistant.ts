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

function messageForReason(code: string): string {
  const mapped = REASON_MESSAGES[code as PasswordFailureReason];
  if (mapped) {
    return mapped;
  }
  return `Regra não atendida: ${code}`;
}

/**
 * Assistente local (sem chamada externa): traduz códigos de regra em dicas legíveis.
 */
export class DeterministicPasswordAssistant implements PasswordAssistantPort {
  async enrichWithHints(
    _password: string,
    reasonsWhenInvalid: readonly PasswordFailureReason[],
  ): Promise<readonly string[]> {
    if (reasonsWhenInvalid.length === 0) {
      return ["Senha atende a todas as regras configuradas nesta API."];
    }
    return reasonsWhenInvalid.map(messageForReason);
  }
}

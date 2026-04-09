import type { PasswordAssistantPort } from "../domain/ports/password-assistant.port.js";
import { ALLOWED_SPECIALS, MIN_LENGTH } from "../domain/password-policy.js";

const REASON_MESSAGES: Record<string, string> = {
  [`comprimento_mínimo_${MIN_LENGTH}`]: `Use pelo menos ${MIN_LENGTH} caracteres.`,
  falta_dígito: "Inclua ao menos um dígito (0-9).",
  falta_letra_minúscula: "Inclua ao menos uma letra minúscula (a-z).",
  falta_letra_maiúscula: "Inclua ao menos uma letra maiúscula (A-Z).",
  falta_caractere_especial_permitido: `Inclua ao menos um destes especiais: ${ALLOWED_SPECIALS}`,
  caracteres_repetidos:
    "Não possua caracteres repetidos: no conjunto da senha, cada caractere deve aparecer apenas uma vez.",
  espaço_em_branco_não_permitido: "Remova espaços em branco.",
  senha_excede_tamanho_máximo: "Senha acima do limite aceito pela API.",
};

function messageForReason(code: string): string {
  const mapped = REASON_MESSAGES[code];
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
    reasonsWhenInvalid: readonly string[],
  ): Promise<readonly string[]> {
    if (reasonsWhenInvalid.length === 0) {
      return ["Senha atende a todas as regras configuradas nesta API."];
    }
    return reasonsWhenInvalid.map(messageForReason);
  }
}

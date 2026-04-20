import { PasswordFailureReason } from "./password-failure-reason.js";
import type { PasswordValidationResult } from "./password-validator.dto.js";

/** Caracteres especiais permitidos pela política (além de letras e dígitos). */
export const ALLOWED_SPECIALS = "!@#$%^&*()-+" as const;

/** Comprimento mínimo da senha (caracteres). */
export const MIN_LENGTH = 9;

export type {
  PasswordValidationFailure,
  PasswordValidationResult,
  PasswordValidationSuccess,
} from "./password-validator.dto.js";

/** Mantém equivalência com a classe `\s` do ECMAScript (inclui Unicode). */
const HAS_WHITESPACE = /\s/;

const SPECIAL_SET = new Set<string>(ALLOWED_SPECIALS.split(""));

type PolicyFlags = {
  tooShort: boolean;
  hasDigit: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasAllowedSpecial: boolean;
  hasUniqueCharacters: boolean;
  hasWhitespace: boolean;
};

/**
 * Uma passada na senha: classes de caracteres ASCII, especiais permitidos e unicidade.
 * Espaço em branco usa um único `\s` na string inteira para igualar a semântica anterior.
 */
function collectPolicyFlags(password: string): PolicyFlags {
  const tooShort = password.length < MIN_LENGTH;
  let hasDigit = false;
  let hasLowercase = false;
  let hasUppercase = false;
  let hasAllowedSpecial = false;
  let hasRepeat = false;
  const seen = new Set<string>();

  for (const c of password) {
    if (seen.has(c)) {
      hasRepeat = true;
    } else {
      seen.add(c);
    }
    if (c >= "0" && c <= "9") {
      hasDigit = true;
    } else if (c >= "a" && c <= "z") {
      hasLowercase = true;
    } else if (c >= "A" && c <= "Z") {
      hasUppercase = true;
    } else if (SPECIAL_SET.has(c)) {
      hasAllowedSpecial = true;
    }
  }

  return {
    tooShort,
    hasDigit,
    hasLowercase,
    hasUppercase,
    hasAllowedSpecial,
    hasUniqueCharacters: !hasRepeat,
    hasWhitespace: HAS_WHITESPACE.test(password),
  };
}

/**
 * Coleta todos os motivos de falha em ordem fixa.
 * @remarks Não retorna no primeiro erro: permite expor várias dicas numa única resposta.
 */
function collectFailureReasons(password: string): PasswordFailureReason[] {
  const f = collectPolicyFlags(password);
  const reasons: PasswordFailureReason[] = [];
  if (f.tooShort) {
    reasons.push(PasswordFailureReason.FaltaComprimentoMinimo);
  }
  if (!f.hasDigit) {
    reasons.push(PasswordFailureReason.FaltaDigito);
  }
  if (!f.hasLowercase) {
    reasons.push(PasswordFailureReason.FaltaLetraMinuscula);
  }
  if (!f.hasUppercase) {
    reasons.push(PasswordFailureReason.FaltaLetraMaiuscula);
  }
  if (!f.hasAllowedSpecial) {
    reasons.push(PasswordFailureReason.FaltaCaractereEspecialPermitido);
  }
  if (!f.hasUniqueCharacters) {
    reasons.push(PasswordFailureReason.CaracteresRepetidos);
  }
  if (f.hasWhitespace) {
    reasons.push(PasswordFailureReason.EspacoEmBrancoNaoPermitido);
  }
  return reasons;
}

/**
 * Valida a senha contra a política (comprimento, classes de caracteres, caracteres únicos, sem espaço).
 * @param password - Senha em texto simples.
 * @returns Sucesso ou falha com lista de {@link PasswordFailureReason}.
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const reasons = collectFailureReasons(password);
  if (reasons.length > 0) {
    return { valid: false, reasons };
  }
  return { valid: true };
}

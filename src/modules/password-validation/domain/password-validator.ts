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

const HAS_DIGIT = /[0-9]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_WHITESPACE = /\s/;

const SPECIAL_SET = new Set<string>(ALLOWED_SPECIALS.split(""));

function hasWhitespace(password: string): boolean {
  return HAS_WHITESPACE.test(password);
}

function hasUniqueCharacters(password: string): boolean {
  return new Set(password).size === password.length;
}

function hasDigit(password: string): boolean {
  return HAS_DIGIT.test(password);
}

function hasLowercase(password: string): boolean {
  return HAS_LOWERCASE.test(password);
}

function hasUppercase(password: string): boolean {
  return HAS_UPPERCASE.test(password);
}

function hasAllowedSpecial(password: string): boolean {
  for (const char of password) {
    if (SPECIAL_SET.has(char)) {
      return true;
    }
  }
  return false;
}

/**
 * Coleta todos os motivos de falha em ordem fixa.
 * @remarks Não retorna no primeiro erro: permite expor várias dicas numa única resposta.
 */
function collectFailureReasons(password: string): PasswordFailureReason[] {
  const reasons: PasswordFailureReason[] = [];
  if (password.length < MIN_LENGTH) {
    reasons.push(PasswordFailureReason.FaltaComprimentoMinimo);
  }
  if (!hasDigit(password)) {
    reasons.push(PasswordFailureReason.FaltaDigito);
  }
  if (!hasLowercase(password)) {
    reasons.push(PasswordFailureReason.FaltaLetraMinuscula);
  }
  if (!hasUppercase(password)) {
    reasons.push(PasswordFailureReason.FaltaLetraMaiuscula);
  }
  if (!hasAllowedSpecial(password)) {
    reasons.push(PasswordFailureReason.FaltaCaractereEspecialPermitido);
  }
  if (!hasUniqueCharacters(password)) {
    reasons.push(PasswordFailureReason.CaracteresRepetidos);
  }
  if (hasWhitespace(password)) {
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

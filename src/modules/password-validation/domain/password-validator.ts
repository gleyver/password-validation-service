import {
  ALLOWED_SPECIALS,
  MAX_PASSWORD_LENGTH,
  MIN_LENGTH,
} from "./password-policy.js";

export type PasswordValidationSuccess = { readonly valid: true };

export type PasswordValidationFailure = {
  readonly valid: false;
  readonly reasons: readonly string[];
};

export type PasswordValidationResult =
  | PasswordValidationSuccess
  | PasswordValidationFailure;

const SPECIAL_SET = new Set<string>(ALLOWED_SPECIALS.split(""));

function hasWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function hasUniqueCharacters(value: string): boolean {
  return new Set(value).size === value.length;
}

function hasDigit(value: string): boolean {
  return /[0-9]/.test(value);
}

function hasLowercase(value: string): boolean {
  return /[a-z]/.test(value);
}

function hasUppercase(value: string): boolean {
  return /[A-Z]/.test(value);
}

function hasAllowedSpecial(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (SPECIAL_SET.has(value[i])) {
      return true;
    }
  }
  return false;
}

function collectFailureReasons(value: string): string[] {
  const reasons: string[] = [];
  if (value.length < MIN_LENGTH) {
    reasons.push(`comprimento_mínimo_${MIN_LENGTH}`);
  }
  if (!hasDigit(value)) {
    reasons.push("falta_dígito");
  }
  if (!hasLowercase(value)) {
    reasons.push("falta_letra_minúscula");
  }
  if (!hasUppercase(value)) {
    reasons.push("falta_letra_maiúscula");
  }
  if (!hasAllowedSpecial(value)) {
    reasons.push("falta_caractere_especial_permitido");
  }
  if (!hasUniqueCharacters(value)) {
    reasons.push("caracteres_repetidos");
  }
  if (hasWhitespace(value)) {
    reasons.push("espaço_em_branco_não_permitido");
  }
  return reasons;
}

/**
 * Regras do desafio: tamanho, classes de caracteres, unicidade, sem whitespace.
 */
export function validatePasswordPolicy(raw: string): PasswordValidationResult {
  if (raw.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, reasons: ["senha_excede_tamanho_máximo"] };
  }
  const reasons = collectFailureReasons(raw);
  if (reasons.length > 0) {
    return { valid: false, reasons };
  }
  return { valid: true };
}

import type { PasswordFailureReason } from "./password-failure-reason.js";

/** Senha conforme a política. */
export type PasswordValidationSuccess = { readonly valid: true };

/** Falha com todos os motivos aplicáveis (ordem fixa). */
export type PasswordValidationFailure = {
  readonly valid: false;
  readonly reasons: readonly PasswordFailureReason[];
};

/** Resultado discriminado de {@link validatePasswordPolicy}. */
export type PasswordValidationResult =
  | PasswordValidationSuccess
  | PasswordValidationFailure;

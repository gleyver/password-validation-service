import type { PasswordFailureReason } from "./password-failure-reason.js";

export type PasswordValidationSuccess = { readonly valid: true };

export type PasswordValidationFailure = {
  readonly valid: false;
  readonly reasons: readonly PasswordFailureReason[];
};

export type PasswordValidationResult =
  | PasswordValidationSuccess
  | PasswordValidationFailure;

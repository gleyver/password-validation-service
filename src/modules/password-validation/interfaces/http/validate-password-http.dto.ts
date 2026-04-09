/** JSON de sucesso (200) de `POST /v1/password-validations`. */
export type ValidatePasswordSuccessJsonBody = {
  readonly valid: boolean;
  readonly assistantHints?: readonly string[];
};

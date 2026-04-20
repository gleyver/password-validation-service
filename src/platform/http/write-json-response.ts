import type { ServerResponse } from "node:http";

const JSON_UTF8 = "application/json; charset=utf-8";

/** Respostas JSON imutáveis frequentes (uma vez no carregamento do módulo). */
export const HTTP_JSON_STATIC = {
  healthOk: JSON.stringify({ status: "ok" }),
  errorNotFound: JSON.stringify({ error: "not_found" }),
  errorInternal: JSON.stringify({ error: "internal_error" }),
  errorEmptyBody: JSON.stringify({ error: "empty_body" }),
  errorInvalidJson: JSON.stringify({ error: "invalid_json" }),
  errorPayloadTooLarge: JSON.stringify({ error: "payload_too_large" }),
  errorInvalidPasswordField: JSON.stringify({
    error: "invalid_password_field",
  }),
} as const;

/**
 * Envia corpo já serializado em UTF-8 (sem `JSON.stringify` no hot path).
 */
export function writeJsonUtf8(
  res: ServerResponse,
  statusCode: number,
  jsonUtf8: string,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", JSON_UTF8);
  res.end(jsonUtf8);
}

/**
 * Define status, `Content-Type` JSON UTF-8 e encerra o corpo com `JSON.stringify`.
 * @param res - Resposta HTTP do Node.
 * @param statusCode - Código HTTP.
 * @param body - Valor serializado (objeto, array, etc.).
 */
export function writeJsonResponse(
  res: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  writeJsonUtf8(res, statusCode, JSON.stringify(body));
}

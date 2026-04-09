import type { ServerResponse } from "node:http";

const JSON_UTF8 = "application/json; charset=utf-8";

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
  res.statusCode = statusCode;
  res.setHeader("Content-Type", JSON_UTF8);
  res.end(JSON.stringify(body));
}

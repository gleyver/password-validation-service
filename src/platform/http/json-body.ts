import type { IncomingMessage } from "node:http";
import type { JsonBodyResult } from "./json-body.dto.js";

export type { JsonBodyResult } from "./json-body.dto.js";

const DEFAULT_LIMIT = 16_384;

/**
 * Lê o corpo da requisição e faz parse JSON com limite de tamanho.
 * @param req - Requisição HTTP (stream).
 * @param limitBytes - Tamanho máximo do corpo em bytes (padrão 16 KiB).
 * @returns Valor tipado ou código de erro (`payload_too_large`, `invalid_json`, `empty_body`).
 */
export async function readJsonBody<T = unknown>(
  req: IncomingMessage,
  limitBytes: number = DEFAULT_LIMIT,
): Promise<JsonBodyResult<T>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > limitBytes) {
      return { ok: false, error: "payload_too_large" };
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (raw.length === 0) {
    return { ok: false, error: "empty_body" };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

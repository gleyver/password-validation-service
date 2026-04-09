/** Resultado de {@link readJsonBody}: valor parseado ou erro de tamanho/corpo/JSON. */
export type JsonBodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "payload_too_large" | "invalid_json" | "empty_body" };

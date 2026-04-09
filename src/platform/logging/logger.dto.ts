export type LogLevel = "debug" | "info" | "warn" | "error";

/** Campos estruturados anexados às linhas de log JSON. */
export type LogFields = Record<string, string | number | boolean | undefined>;

/** Logger JSON em uma linha por evento, com suporte a contexto filho. */
export interface Logger {
  child(fields: LogFields): Logger;
  log(level: LogLevel, message: string, fields?: LogFields): void;
}

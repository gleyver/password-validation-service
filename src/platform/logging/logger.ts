import { randomUUID } from "node:crypto";
import type { LogFields, LogLevel, Logger } from "./logger.dto.js";

export type { LogFields, LogLevel, Logger } from "./logger.dto.js";

function serialize(
  base: LogFields,
  message: string,
  fields?: LogFields,
): string {
  const payload = {
    ts: new Date().toISOString(),
    msg: message,
    ...base,
    ...fields,
  };
  return `${JSON.stringify(payload)}\n`;
}

/**
 * Cria um logger que grava uma linha JSON por evento, com campos base opcionais.
 * @param baseFields - Incluídos em toda linha (ex.: `service`).
 */
export function createLogger(baseFields: LogFields = {}): Logger {
  const write = (level: LogLevel, message: string, fields?: LogFields) => {
    const line = serialize({ ...baseFields, level }, message, fields);
    if (level === "error") {
      process.stderr.write(line);
      return;
    }
    process.stdout.write(line);
  };
  return {
    child(extra: LogFields): Logger {
      return createLogger({ ...baseFields, ...extra });
    },
    log(level: LogLevel, message: string, fields?: LogFields): void {
      write(level, message, fields);
    },
  };
}

/** Gera um UUID v4 para correlacionar logs por requisição. */
export function newRequestId(): string {
  return randomUUID();
}

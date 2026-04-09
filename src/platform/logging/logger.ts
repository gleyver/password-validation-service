import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, string | number | boolean | undefined>;

export interface Logger {
  child(fields: LogFields): Logger;
  log(level: LogLevel, message: string, fields?: LogFields): void;
}

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

export function newRequestId(): string {
  return randomUUID();
}

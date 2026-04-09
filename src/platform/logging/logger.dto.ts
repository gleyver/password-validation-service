export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, string | number | boolean | undefined>;

export interface Logger {
  child(fields: LogFields): Logger;
  log(level: LogLevel, message: string, fields?: LogFields): void;
}

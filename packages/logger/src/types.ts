export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** Meta stays primitive so any sink can index it; richer context belongs in `error`. */
export type LogValue = string | number | boolean | null | undefined;

export type LogMeta = Record<string, LogValue>;

export interface LogRecord {
  readonly time: Date;
  readonly level: LogLevel;
  readonly scope: string | undefined;
  /** Stable aggregation key. Keep it a literal; dynamic values belong in `meta`. */
  readonly event: string | undefined;
  readonly message: string;
  readonly meta: LogMeta | undefined;
  readonly error: Error | undefined;
}

/** The single exit for every log and report. Monitoring backends plug in here. */
export interface LogSink {
  readonly name: string;
  readonly write: (record: LogRecord) => void;
}

export interface LogInput {
  message: string;
  event?: string;
  meta?: LogMeta;
}

export interface ErrorLogInput extends LogInput {
  error: Error;
}

export interface LoggerOptions {
  scope?: string;
  meta?: LogMeta;
}

export interface Logger {
  readonly debug: (input: LogInput) => void;
  readonly info: (input: LogInput) => void;
  readonly warn: (input: LogInput) => void;
  /** `error` carries an `Error` so the stack can never be lost on the way to a sink. */
  readonly error: (input: ErrorLogInput) => void;
  readonly fatal: (input: ErrorLogInput) => void;
  readonly child: (options: LoggerOptions) => Logger;
}

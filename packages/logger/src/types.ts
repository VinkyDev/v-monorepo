export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogValue = string | number | boolean | null | undefined;

export type LogMeta = Record<string, LogValue>;

export interface LogRecord {
  readonly time: Date;
  readonly level: LogLevel;
  readonly scope: string | undefined;
  readonly event: string | undefined;
  readonly message: string;
  readonly meta: LogMeta | undefined;
  readonly error: Error | undefined;
}

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
  /** 必须携带 `Error`，保证堆栈不丢。 */
  readonly error: (input: ErrorLogInput) => void;
  readonly fatal: (input: ErrorLogInput) => void;
  readonly child: (options: LoggerOptions) => Logger;
}

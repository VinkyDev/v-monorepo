export { consoleSink } from "./console-sink.ts";
export { addSink, createLogger, logger, setSinks } from "./logger.ts";
export type { SerializedError } from "./serialize.ts";
export { safeJson, serializeError, toError } from "./serialize.ts";
export type {
  ErrorLogInput,
  LogInput,
  LogLevel,
  Logger,
  LoggerOptions,
  LogMeta,
  LogRecord,
  LogSink,
  LogValue,
} from "./types.ts";

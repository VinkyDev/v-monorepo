import type {
  ErrorLogInput,
  LogInput,
  LogLevel,
  LogMeta,
  LogRecord,
  Logger,
  LoggerOptions,
  LogSink,
} from "./types.ts";

const sinks: LogSink[] = [];

/** The single integration point: one `addSink` call wires up a monitoring backend. */
export const addSink = (sink: LogSink): void => {
  sinks.push(sink);
};

export const setSinks = (next: readonly LogSink[]): void => {
  sinks.length = 0;
  sinks.push(...next);
};

const mergeMeta = (
  base: LogMeta | undefined,
  extra: LogMeta | undefined
): LogMeta | undefined => {
  if (base === undefined) {
    return extra;
  }
  if (extra === undefined) {
    return base;
  }
  return { ...base, ...extra };
};

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const emit = (level: LogLevel, input: LogInput, error?: Error): void => {
    const record: LogRecord = {
      error,
      event: input.event,
      level,
      message: input.message,
      meta: mergeMeta(options.meta, input.meta),
      scope: options.scope,
      time: new Date(),
    };
    for (const sink of sinks) {
      sink.write(record);
    }
  };

  const withError =
    (level: LogLevel) =>
    (input: ErrorLogInput): void => {
      emit(level, input, input.error);
    };

  return {
    child: (childOptions) =>
      createLogger({
        meta: mergeMeta(options.meta, childOptions.meta),
        scope: childOptions.scope ?? options.scope,
      }),
    debug: (input) => {
      emit("debug", input);
    },
    error: withError("error"),
    fatal: withError("fatal"),
    info: (input) => {
      emit("info", input);
    },
    warn: (input) => {
      emit("warn", input);
    },
  };
};

export const logger = createLogger();

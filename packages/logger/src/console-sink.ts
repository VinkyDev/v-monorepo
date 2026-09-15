import type { LogLevel, LogMeta, LogRecord, LogSink } from "./types.ts";

const levelColor: Record<LogLevel, string> = {
  debug: "#8e8e93",
  error: "#cc3333",
  fatal: "#ff0000",
  info: "#0099cc",
  warn: "#cc9900",
};

const consoleMethod = (level: LogLevel): "debug" | "info" | "warn" | "error" =>
  level === "fatal" ? "error" : level;

const headline = (record: LogRecord): string =>
  record.event === undefined
    ? record.message
    : `${record.event} · ${record.message}`;

/** Passed through unflattened so devtools can expand them. */
const details = (record: LogRecord): (LogMeta | Error)[] => {
  const extra: (LogMeta | Error)[] = [];
  if (record.meta !== undefined) {
    extra.push(record.meta);
  }
  if (record.error !== undefined) {
    extra.push(record.error);
  }
  return extra;
};

const writeBrowser = (record: LogRecord): void => {
  const label =
    record.scope === undefined
      ? record.level
      : `${record.level} ${record.scope}`;
  // oxlint-disable-next-line no-console -- the console sink is the one place console is the product
  console[consoleMethod(record.level)](
    `%c${label}%c ${headline(record)}`,
    `background:${levelColor[record.level]};color:#fff;padding:1px 5px;border-radius:3px`,
    "",
    ...details(record)
  );
};

const writeNode = (record: LogRecord): void => {
  const scope = record.scope === undefined ? "" : ` [${record.scope}]`;
  // oxlint-disable-next-line no-console -- the console sink is the one place console is the product
  console[consoleMethod(record.level)](
    `${record.time.toTimeString().slice(0, 8)} ${record.level.toUpperCase().padEnd(5)}${scope} ${headline(record)}`,
    ...details(record)
  );
};

export const consoleSink: LogSink = {
  name: "console",
  write: (record) => {
    if ("document" in globalThis) {
      writeBrowser(record);
      return;
    }
    writeNode(record);
  },
};

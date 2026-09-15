import { setSinks } from "./logger.ts";
import type { LogRecord } from "./types.ts";

/** Replaces every sink with one that records, so a test can assert on what was logged. */
export const collectLogs = (): LogRecord[] => {
  const records: LogRecord[] = [];
  setSinks([
    {
      name: "collect",
      write: (record) => {
        records.push(record);
      },
    },
  ]);
  return records;
};

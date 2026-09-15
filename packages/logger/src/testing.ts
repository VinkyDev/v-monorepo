import { setSinks } from "./logger.ts";
import type { LogRecord } from "./types.ts";

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

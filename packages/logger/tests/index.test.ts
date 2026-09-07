import { describe, expect, test } from "vite-plus/test";

import { createLogger } from "#/index.ts";

describe("logger", () => {
  test("createLogger mutes under vitest and uses local time", () => {
    const logger = createLogger({ name: "test" });
    expect(logger.settings.type).toBe("hidden");
    expect(logger.settings.pretty.timeZone).toBe("local");
  });

  test("runInContext attaches context to the record", () => {
    const logger = createLogger({ name: "test" });
    const seen = logger.runInContext({ job: "sync" }, () => ({
      context: logger.getContext(),
      record: logger.info("hello"),
    }));
    expect(seen.context).toStrictEqual({ job: "sync" });
    expect(JSON.stringify(seen.record)).toContain('"job":"sync"');
  });
});

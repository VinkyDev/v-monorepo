import { describe, expect, test } from "vite-plus/test";

import { createLogger } from "#/index.ts";

describe("logger", () => {
  test("createLogger mutes under vitest and uses local time", () => {
    const logger = createLogger({ name: "test" });
    expect(logger.settings.type).toBe("hidden");
    expect(logger.settings.pretty.timeZone).toBe("local");
  });

  test("runInContext attaches requestId to the record", () => {
    const logger = createLogger({ name: "test" });
    const seen = logger.runInContext({ requestId: "req-1" }, () => ({
      context: logger.getContext(),
      record: logger.info("hello"),
    }));
    expect(seen.context).toStrictEqual({ requestId: "req-1" });
    expect(JSON.stringify(seen.record)).toContain('"requestId":"req-1"');
  });
});

import { expect, test } from "vite-plus/test";
import { createLogger } from "@/index.ts";

test("createLogger mutes the console under vitest", () => {
  const logger = createLogger({ name: "test" });
  expect(logger.info("hello")).toBeDefined();
});

test("runInContext attaches requestId to the record", () => {
  const logger = createLogger({ name: "test" });
  const seen = logger.runInContext({ requestId: "req-1" }, () => ({
    context: logger.getContext(),
    record: logger.info("hello"),
  }));
  expect(seen.context).toEqual({ requestId: "req-1" });
  expect(JSON.stringify(seen.record)).toContain('"requestId":"req-1"');
});

test("pretty timestamps follow the process timezone", () => {
  const logger = createLogger({ name: "test" });
  expect(logger.settings.pretty.timeZone).toBe("local");
});

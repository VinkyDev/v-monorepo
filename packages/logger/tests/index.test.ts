import { ApiError } from "@v-monorepo/shared";
import { beforeEach, describe, expect, test } from "vite-plus/test";

import type { LogRecord } from "#/index.ts";
import { createLogger, safeJson, serializeError, setSinks } from "#/index.ts";
import { collectLogs } from "#/testing.ts";

describe("logger", () => {
  let records: LogRecord[] = [];

  beforeEach(() => {
    records = collectLogs();
  });

  test("writes the four-tuple payload to every sink", () => {
    const other: LogRecord[] = [];
    setSinks([
      {
        name: "collect",
        write: (record) => {
          records.push(record);
        },
      },
      {
        name: "other",
        write: (record) => {
          other.push(record);
        },
      },
    ]);
    const error = new Error("boom");

    createLogger().error({
      error,
      event: "api_request_failed",
      message: "GET /widgets -> 500",
      meta: { status: 500 },
    });

    expect(other).toHaveLength(1);
    expect(records).toMatchObject([
      {
        error,
        event: "api_request_failed",
        level: "error",
        message: "GET /widgets -> 500",
        meta: { status: 500 },
        scope: undefined,
      },
    ]);
  });

  test("leaves event undefined when the caller omits it", () => {
    createLogger().info({ message: "listening on 3000" });

    expect(records).toMatchObject([
      { event: undefined, level: "info", message: "listening on 3000" },
    ]);
  });

  test("child overrides scope and merges meta", () => {
    const child = createLogger({ meta: { app: "web" }, scope: "root" }).child({
      meta: { job: "sync" },
      scope: "worker",
    });

    child.warn({ message: "slow", meta: { ms: 900 } });

    expect(records).toMatchObject([
      { meta: { app: "web", job: "sync", ms: 900 }, scope: "worker" },
    ]);
  });
});

describe(serializeError, () => {
  test("keeps the standard Error fields and flattens the cause", () => {
    const record = serializeError(
      new Error("outer", { cause: new TypeError("inner") })
    );

    expect(record).toMatchObject({
      cause: "TypeError: inner",
      message: "outer",
      name: "Error",
    });
    expect(record.stack).toContain("Error: outer");
  });

  test("adds the ApiError fields", () => {
    const record = serializeError(
      new ApiError("not_found", {
        request: { method: "GET", path: "/widgets/42" },
        traceId: "req-1",
      })
    );

    expect(record).toMatchObject({
      code: "not_found",
      name: "ApiError",
      request: "GET /widgets/42",
      status: 404,
      traceId: "req-1",
    });
  });

  test("describes a non-Error throw", () => {
    expect(serializeError("nope")).toStrictEqual({
      message: '"nope"',
      name: "NonError",
    });
  });
});

describe(safeJson, () => {
  test("falls back instead of throwing", () => {
    interface Ring {
      name: string;
      self?: Ring;
    }
    const circular: Ring = { name: "root" };
    circular.self = circular;

    expect(safeJson(circular)).toBe("[unserializable]");
    expect(safeJson({ big: 1n })).toBe("[unserializable]");
  });
});

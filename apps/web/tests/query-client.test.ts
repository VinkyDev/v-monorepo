import type { LogRecord } from "@v-monorepo/logger";
import { collectLogs } from "@v-monorepo/logger/testing";
import { ApiError } from "@v-monorepo/shared";
import { beforeEach, describe, expect, test } from "vite-plus/test";

import { runApiErrorEffect } from "#/lib/api-error-effects.ts";
import { toErrorView } from "#/lib/error-view.ts";
import { createQueryClient, isRetryable } from "#/lib/query-client.ts";

const failingQuery = async (cause: Error) => {
  const queryClient = createQueryClient();
  let attempts = 0;

  await expect(
    queryClient.query({
      queryFn: () => {
        attempts += 1;
        throw cause;
      },
      queryKey: [cause.message],
      retryDelay: 0,
    })
  ).rejects.toBe(cause);

  return attempts;
};

describe(isRetryable, () => {
  test.for([
    ["internal", true],
    ["unavailable", true],
    ["rate_limited", true],
    ["not_found", false],
    ["invalid_params", false],
  ] as const)("%s -> %s", ([code, expected]) => {
    expect(isRetryable(new ApiError(code))).toBe(expected);
  });

  test("an unknown throw is not retried", () => {
    expect(isRetryable(new Error("render crash"))).toBeFalsy();
  });
});

describe(createQueryClient, () => {
  let logs: LogRecord[] = [];

  beforeEach(() => {
    logs = collectLogs();
  });

  test("retries a server fault up to VITE_MAX_RETRY_COUNT, a client fault never", async () => {
    await expect(failingQuery(new ApiError("internal"))).resolves.toBe(2);
    await expect(failingQuery(new ApiError("not_found"))).resolves.toBe(1);
  });

  test("reports server faults only, and never a cancellation", async () => {
    await failingQuery(new ApiError("internal"));
    expect(logs).toMatchObject([{ event: "api_request_failed" }]);

    logs.length = 0;
    await failingQuery(new ApiError("not_found"));
    await failingQuery(new DOMException("aborted", "AbortError"));
    expect(logs).toHaveLength(0);
  });
});

describe(runApiErrorEffect, () => {
  test("claims a code with a global effect", () => {
    const queryClient = createQueryClient();

    expect(
      runApiErrorEffect(new ApiError("session_expired"), queryClient)
    ).toBeTruthy();
    expect(
      runApiErrorEffect(new ApiError("not_found"), queryClient)
    ).toBeFalsy();
    expect(
      runApiErrorEffect(new Error("render crash"), queryClient)
    ).toBeFalsy();
  });
});

describe(toErrorView, () => {
  test("keeps the server's message, exposing the trace id only on 5xx", () => {
    expect(
      toErrorView(new ApiError("internal", { traceId: "req-1" }))
    ).toStrictEqual({ message: "服务异常，请稍后重试", traceId: "req-1" });
    expect(
      toErrorView(new ApiError("not_found", { traceId: "req-1" })).traceId
    ).toBeUndefined();
  });

  test("does not leak the message of an unknown throw", () => {
    expect(toErrorView(new Error("secret internals")).message).toBe(
      "服务异常，请稍后重试"
    );
  });
});

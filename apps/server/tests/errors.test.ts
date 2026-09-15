import type { LogRecord } from "@v-monorepo/logger";
import { collectLogs } from "@v-monorepo/logger/testing";
import { ApiError, BODY_LIMIT_BYTES, errorCatalog } from "@v-monorepo/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { beforeEach, describe, expect, test } from "vite-plus/test";

import { createApp } from "#/app.ts";
import type { AppEnv } from "#/lib/error.ts";
import { handleError } from "#/lib/error.ts";

const request = async (path: string, init?: RequestInit): Promise<Response> =>
  await createApp().request(path, init);

const readError = async (response: Response): Promise<ApiError> => {
  expect(response.headers.get("content-type")).toContain("application/json");
  return await ApiError.fromResponse(response);
};

const appWith = (routes: Record<string, () => never>): Hono<AppEnv> => {
  const app = new Hono<AppEnv>().use(requestId());
  for (const [path, handler] of Object.entries(routes)) {
    app.get(path, handler);
  }
  return app.onError(handleError);
};

describe("app edges", () => {
  test("responses allow any origin and carry a request id", async () => {
    const response = await request("/api/health", {
      headers: { Origin: "https://example.com" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  test("unknown routes return the not_found code", async () => {
    const response = await request("/api/missing");
    const error = await readError(response);

    expect(response.status).toBe(404);
    expect(error.code).toBe("not_found");
  });

  test("payload over the body limit returns payload_too_large", async () => {
    const response = await request("/api/health", {
      body: "x".repeat(BODY_LIMIT_BYTES + 1),
      method: "POST",
    });
    const error = await readError(response);

    expect(response.status).toBe(413);
    expect(error.code).toBe("payload_too_large");
  });
});

describe("demo routes", () => {
  test.for([
    ["unauthorized", 401, "unauthorized"],
    ["not_found", 404, "not_found"],
    ["timeout", 504, "timeout"],
    ["session_expired", 401, "session_expired"],
    ["crash", 500, "internal"],
  ] as const)("?fail=%s answers %i", async ([fail, status, code]) => {
    const response = await request(`/api/demo/probe?fail=${fail}`);
    const error = await readError(response);

    expect(response.status).toBe(status);
    expect(error.code).toBe(code);
  });

  test("a probe without a failure succeeds", async () => {
    const response = await request("/api/demo/probe");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({ ok: true });
  });

  test("an unknown query value fails validation", async () => {
    const response = await request("/api/demo/probe?fail=nope");
    const error = await readError(response);

    expect(response.status).toBe(422);
    expect(error.data).toMatchObject({ fields: [{ path: "fail" }] });
  });

  test("invalid params carry a message per dotted field path", async () => {
    const response = await request("/api/demo/signup", {
      body: JSON.stringify({ email: "nope", name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const error = await readError(response);

    expect(response.status).toBe(422);
    expect(error.code).toBe("invalid_params");
    // `data` only survives parsing when every field carries a non-empty message.
    expect(error.data).toMatchObject({
      fields: [{ path: "email" }, { path: "name" }],
    });
  });

  test("a business failure carries its typed data", async () => {
    const response = await request("/api/demo/signup", {
      body: JSON.stringify({ email: "taken@example.com", name: "Ada" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const error = await readError(response);

    expect(response.status).toBe(409);
    expect(error.code).toBe("email_taken");
    expect(error.data).toStrictEqual({ email: "taken@example.com" });
  });
});

describe(handleError, () => {
  let logs: LogRecord[] = [];

  beforeEach(() => {
    logs = collectLogs();
  });

  test("an unhandled error becomes a generic 500 and is logged once", async () => {
    const app = appWith({
      "/boom": () => {
        throw new Error("secret internals");
      },
    });

    const error = await readError(await app.request("/boom"));

    expect(error.code).toBe("internal");
    expect(error.message).toBe(errorCatalog.internal.message);
    expect(logs).toMatchObject([
      {
        event: "api_request_failed",
        level: "error",
        meta: { code: "internal", status: 500 },
      },
    ]);
    expect(logs[0]?.meta?.requestId).toBeTruthy();
  });

  test("logs a thrown 5xx but stays quiet about a 4xx", async () => {
    const app = appWith({
      "/down": () => {
        throw new ApiError("unavailable");
      },
      "/gone": () => {
        throw new ApiError("not_found");
      },
    });

    await app.request("/gone");
    expect(logs).toHaveLength(0);

    await app.request("/down");
    expect(logs).toMatchObject([{ meta: { code: "unavailable" } }]);
  });

  test("HTTPException keeps 4xx messages and hides 5xx messages", async () => {
    const app = appWith({
      "/boom": () => {
        throw new HTTPException(500, { message: "secret internals" });
      },
      "/gone": () => {
        throw new HTTPException(404, { message: "Widget not found" });
      },
    });

    const gone = await readError(await app.request("/gone"));
    expect(gone.code).toBe("not_found");
    expect(gone.message).toBe("Widget not found");

    const boom = await readError(await app.request("/boom"));
    expect(boom.code).toBe("internal");
    expect(boom.message).toBe(errorCatalog.internal.message);
  });
});

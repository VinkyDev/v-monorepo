import { createApp } from "@v-monorepo/server";
import {
  errorCatalog,
  healthStatusSchema,
  isApiError,
} from "@v-monorepo/shared";
import type { ApiError } from "@v-monorepo/shared";
import { describe, expect, test } from "vite-plus/test";

import { createApiClient } from "#/index.ts";

const clientFor = (baseUrl: string) => {
  const app = createApp();
  return createApiClient(baseUrl, {
    fetch: async (input, init) =>
      await app.fetch(
        input instanceof Request ? input : new Request(input, init)
      ),
  });
};

const failingClient = (fetchFn: typeof fetch) =>
  createApiClient("https://api.test", { fetch: fetchFn });

const expectApiError = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (error) {
    if (isApiError(error)) {
      return error;
    }
    throw error;
  }
  throw new Error("expected the client to throw");
};

describe(createApiClient, () => {
  test("reads a successful response", async () => {
    const response = await clientFor(
      "http://v-monorepo.test/api"
    ).health.$get();

    expect(healthStatusSchema.parse(await response.json()).status).toBe("ok");
  });

  test("restores the server's code, message and trace id", async () => {
    const client = clientFor("http://v-monorepo.test/api");

    const error = await expectApiError(
      client.demo.probe.$get({ query: { fail: "session_expired" } })
    );

    expect(error.code).toBe("session_expired");
    expect(error.status).toBe(401);
    expect(error.message).toBe(errorCatalog.session_expired.message);
    expect(error.traceId).toBeTruthy();
    expect(error.request).toStrictEqual({
      method: "GET",
      path: "/api/demo/probe",
      status: 401,
    });
  });

  test("passes an abort through untouched", async () => {
    const client = failingClient(() => {
      throw new DOMException("aborted", "AbortError");
    });

    await expect(client.health.$get()).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  test("maps a timeout to the timeout code", async () => {
    const client = failingClient(() => {
      throw new DOMException("too slow", "TimeoutError");
    });

    const error = await expectApiError(client.health.$get());

    expect(error.code).toBe("timeout");
  });

  test("maps an unreachable server to unavailable, which is retryable", async () => {
    const client = failingClient(() => {
      throw new TypeError("network down");
    });

    const error = await expectApiError(client.health.$get());

    expect(error.code).toBe("unavailable");
    expect(error.status).toBe(503);
    expect(error.cause).toBeInstanceOf(TypeError);
    expect(error.request).toStrictEqual({
      method: "GET",
      path: "/health",
    });
  });

  test("falls back to the status when the response is not ours", async () => {
    const client = failingClient(
      async () =>
        await Promise.resolve(
          new Response("<html>gateway</html>", {
            headers: { "content-type": "text/html" },
            status: 502,
          })
        )
    );

    const error = await expectApiError(client.health.$get());

    expect(error.code).toBe("internal");
    expect(error.request?.status).toBe(502);
  });
});

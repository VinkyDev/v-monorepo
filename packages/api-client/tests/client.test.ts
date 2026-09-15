import { once } from "node:events";

import { createApp } from "@v-monorepo/server";
import {
  errorCatalog,
  healthStatusSchema,
  isApiError,
} from "@v-monorepo/shared";
import type { ApiError } from "@v-monorepo/shared";
import { describe, expect, test } from "vite-plus/test";

import { createApiClient } from "#/index.ts";

const baseUrl = "/api";
const origin = "http://v-monorepo.test";

const urlOf = (input: RequestInfo | URL): URL =>
  new URL(input instanceof Request ? input.url : input, origin);

const appFetch =
  (onRequest?: (request: Request) => void): typeof fetch =>
  async (input, init) => {
    const request = new Request(urlOf(input), init);
    onRequest?.(request);
    return await createApp().fetch(request);
  };

const clientFor = (onRequest?: (request: Request) => void) =>
  createApiClient(baseUrl, { fetch: appFetch(onRequest) });

const failingClient = (fetchFn: typeof fetch, timeoutMs?: number) =>
  createApiClient("https://api.test", { fetch: fetchFn, timeoutMs });

/** 只在 signal 中止时响应并带上 reason，与 `fetch` 行为一致。 */
const hangingFetch: typeof fetch = async (_input, init) => {
  const signal = init?.signal ?? AbortSignal.abort();
  if (!signal.aborted) {
    await once(signal, "abort");
  }
  signal.throwIfAborted();
  throw new Error("the client attached no signal to abort");
};

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
    const response = await clientFor().health.$get();

    expect(healthStatusSchema.parse(await response.json()).status).toBe("ok");
  });

  test("restores the server's code, message and trace id", async () => {
    const error = await expectApiError(
      clientFor().demo.probe.$get({ query: { fail: "session_expired" } })
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

  test("never lets a query string into the request summary", async () => {
    const error = await expectApiError(
      clientFor().demo.probe.$get({ query: { fail: "unauthorized" } })
    );

    expect(error.request?.path).toBe("/api/demo/probe");
  });

  test("sends a trace id the server adopts as its own", async () => {
    const sent: (string | null)[] = [];
    const client = clientFor((request) => {
      sent.push(request.headers.get("x-request-id"));
    });

    const error = await expectApiError(
      client.demo.probe.$get({ query: { fail: "not_found" } })
    );

    expect(sent[0]).toBeTruthy();
    expect(error.traceId).toBe(sent[0]);
  });

  test("passes an abort through untouched, deadline or not", async () => {
    const client = failingClient(hangingFetch);

    await expect(
      client.health.$get(undefined, { init: { signal: AbortSignal.abort() } })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  test("gives up on a server that never answers", async () => {
    const client = failingClient(hangingFetch, 5);

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
    expect(error.traceId).toBeTruthy();
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

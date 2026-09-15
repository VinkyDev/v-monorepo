import type { AppType } from "@v-monorepo/server/api";
import { ApiError } from "@v-monorepo/shared";
import type { RequestSummary } from "@v-monorepo/shared";
import { hc } from "hono/client";
import type { ClientRequestOptions } from "hono/client";

const DEFAULT_TIMEOUT_MS = 15_000;

const TRACE_HEADER = "X-Request-Id";

export interface CreateApiClientOptions extends Pick<
  ClientRequestOptions,
  "headers"
> {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const nameOf = (cause: unknown): string | undefined =>
  cause instanceof Error ? cause.name : undefined;

const LOCAL_BASE = "http://localhost";

const pathOf = (url: string): string =>
  URL.canParse(url, LOCAL_BASE) ? new URL(url, LOCAL_BASE).pathname : url;

const describeRequest = (
  input: RequestInfo | URL,
  init: RequestInit
): RequestSummary =>
  input instanceof Request
    ? { method: input.method, path: pathOf(input.url) }
    : {
        method: init.method ?? "GET",
        path: pathOf(input instanceof URL ? input.href : input),
      };

/** 组合 signal 沿用先中止者的 reason，据此区分超时与取消。 */
const withDeadline = (
  signal: AbortSignal | null | undefined,
  timeoutMs: number
): AbortSignal => {
  const deadline = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
};

const apiFetch =
  (fetchFn: typeof fetch, timeoutMs: number): typeof fetch =>
  async (input, init) => {
    const source = input instanceof Request ? input : undefined;
    const headers = new Headers(init?.headers ?? source?.headers);
    const traceId = headers.get(TRACE_HEADER) ?? crypto.randomUUID();
    headers.set(TRACE_HEADER, traceId);

    const request: RequestInit = {
      ...init,
      headers,
      signal: withDeadline(init?.signal ?? source?.signal, timeoutMs),
    };

    let response: Response;
    try {
      response = await fetchFn(input, request);
    } catch (error) {
      if (nameOf(error) === "AbortError") {
        throw error;
      }
      throw new ApiError(
        nameOf(error) === "TimeoutError" ? "timeout" : "unavailable",
        { cause: error, request: describeRequest(input, request), traceId }
      );
    }

    if (response.ok) {
      return response;
    }
    throw await ApiError.fromResponse(response, {
      request: { ...describeRequest(input, request), status: response.status },
      traceId,
    });
  };

/** 调用时才取 `globalThis.fetch`，事后补丁对已有 client 也生效。 */
const globalFetch: typeof fetch = async (input, init) =>
  await globalThis.fetch(input, init);

export const createApiClient = (
  baseUrl: string,
  {
    fetch: fetchFn = globalFetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...options
  }: CreateApiClientOptions = {}
) => hc<AppType>(baseUrl, { ...options, fetch: apiFetch(fetchFn, timeoutMs) });

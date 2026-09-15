import type { AppType } from "@v-monorepo/server/api";
import { ApiError } from "@v-monorepo/shared";
import type { RequestSummary } from "@v-monorepo/shared";
import { hc } from "hono/client";
import type { ClientRequestOptions } from "hono/client";

/** Above the server's own 10s timeout, so its 504 wins the race and keeps its body. */
const DEFAULT_TIMEOUT_MS = 15_000;

/** The server's `requestId` adopts a well-formed inbound value, so one id spans both logs. */
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

/** A relative base URL — the web app uses `/api` — only yields a pathname against a base. */
const LOCAL_BASE = "http://localhost";

/** Query strings can carry tokens, so only the path survives into a log. */
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

/** The composite adopts the first signal's reason, which is what tells the two apart. */
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
    // `init` wins over a `Request` input, the same precedence `fetch` itself applies.
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
      // A cancellation is not a failure; wrapping it would fake a server error.
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

/** Resolved per call, so a late `globalThis.fetch` patch still reaches an existing client. */
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

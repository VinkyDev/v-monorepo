import type { AppType } from "@v-monorepo/server/api";
import { ApiError } from "@v-monorepo/shared";
import type { RequestSummary } from "@v-monorepo/shared";
import { hc } from "hono/client";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface CreateApiClientOptions {
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

const nameOf = (cause: unknown): string | undefined =>
  cause instanceof Error ? cause.name : undefined;

/** Query strings can carry tokens, so only the path survives into a log. */
const pathOf = (url: string): string =>
  URL.canParse(url) ? new URL(url).pathname : url;

const describeRequest = (
  input: RequestInfo | URL,
  init: RequestInit | undefined
): RequestSummary =>
  input instanceof Request
    ? { method: input.method, path: pathOf(input.url) }
    : {
        method: init?.method ?? "GET",
        path: pathOf(input instanceof URL ? input.href : input),
      };

const apiFetch =
  (fetchFn: typeof fetch): typeof fetch =>
  async (input, init) => {
    let response: Response;
    try {
      response = await fetchFn(input, init);
    } catch (error) {
      // A cancellation is not a failure; wrapping it would fake a server error.
      if (nameOf(error) === "AbortError") {
        throw error;
      }
      throw new ApiError(
        nameOf(error) === "TimeoutError" ? "timeout" : "unavailable",
        { cause: error, request: describeRequest(input, init) }
      );
    }

    if (response.ok) {
      return response;
    }
    throw await ApiError.fromResponse(response, {
      request: { ...describeRequest(input, init), status: response.status },
    });
  };

export const createApiClient = (
  baseUrl: string,
  options: CreateApiClientOptions = {}
) =>
  hc<AppType>(baseUrl, {
    fetch: apiFetch(options.fetch ?? globalThis.fetch.bind(globalThis)),
    headers: options.headers,
  });

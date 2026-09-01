import type { AppType } from "@v-monorepo/server/api";
import {
  AppError,
  createRequestId,
  REQUEST_ID_HEADER,
} from "@v-monorepo/shared";
import { hc } from "hono/client";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface CreateApiClientOptions {
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

const withClientFetch =
  (fetchFn: typeof fetch): typeof fetch =>
  async (input, init) => {
    const headers = new Headers(init?.headers);
    if (input instanceof Request) {
      for (const [key, value] of input.headers.entries()) {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      }
    }
    if (!headers.has(REQUEST_ID_HEADER)) {
      headers.set(REQUEST_ID_HEADER, createRequestId());
    }

    try {
      const response =
        input instanceof Request
          ? await fetchFn(new Request(input, { ...init, headers }))
          : await fetchFn(input, { ...init, headers });
      if (response.ok) {
        return response;
      }
      throw await AppError.fromResponse(response);
    } catch (error) {
      throw AppError.fromCause(error);
    }
  };

export const createApiClient = (
  baseUrl: string,
  options: CreateApiClientOptions = {}
) =>
  hc<AppType>(baseUrl, {
    fetch: withClientFetch(options.fetch ?? globalThis.fetch.bind(globalThis)),
    headers: options.headers,
  });

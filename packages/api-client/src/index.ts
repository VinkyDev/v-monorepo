import type { AppType } from "@v-monorepo/server/api";
import { AppError } from "@v-monorepo/shared";
import { hc } from "hono/client";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface CreateApiClientOptions {
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

const withClientFetch =
  (fetchFn: typeof fetch): typeof fetch =>
  async (input, init) => {
    try {
      const response = await fetchFn(input, init);
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

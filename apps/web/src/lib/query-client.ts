import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { logger } from "@v-monorepo/logger";
import { isApiError } from "@v-monorepo/shared";
import { toast } from "@v-monorepo/ui/components/toast";

import { env } from "#/env.ts";
import { runApiErrorEffect } from "#/lib/api-error-effects.ts";
import { toErrorView } from "#/lib/error-view.ts";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { showErrorToast?: boolean };
  }
}

export const isRetryable = (cause: unknown): boolean =>
  isApiError(cause) && (cause.status >= 500 || cause.code === "rate_limited");

const isWorthReporting = (cause: Error): boolean =>
  cause.name !== "AbortError" && (!isApiError(cause) || cause.status >= 500);

const report = (cause: Error): void => {
  if (!isWorthReporting(cause)) {
    return;
  }
  logger.error({
    error: cause,
    event: "api_request_failed",
    message: cause.message,
  });
};

const toastError = (cause: Error): void => {
  toast.add({
    priority: "high",
    title: toErrorView(cause).message,
    type: "error",
  });
};

export const createQueryClient = (): QueryClient => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, cause) =>
          isRetryable(cause) && failureCount < env.VITE_MAX_RETRY_COUNT,
        throwOnError: (_cause, query) => query.state.data === undefined,
      },
    },
    mutationCache: new MutationCache({
      onError: (cause, _variables, _context, mutation) => {
        report(cause);
        if (runApiErrorEffect(cause, queryClient)) {
          return;
        }
        if (mutation.meta?.showErrorToast !== false) {
          toastError(cause);
        }
      },
    }),
    queryCache: new QueryCache({
      onError: (cause, query) => {
        report(cause);
        if (runApiErrorEffect(cause, queryClient)) {
          return;
        }
        if (query.state.data !== undefined) {
          toastError(cause);
        }
      },
    }),
  });

  return queryClient;
};

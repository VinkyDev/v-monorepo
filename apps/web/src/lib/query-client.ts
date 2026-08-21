import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { AppError } from "@v-monorepo/shared";
import { toast } from "@v-monorepo/ui/components/toast";

function toastQueryError(title: string, description: string | undefined) {
  if (description === undefined) {
    toast.add({ type: "error", title, priority: "high" });
    return;
  }
  toast.add({ type: "error", title, description, priority: "high" });
}

function notifyFromError(error: Error) {
  const appError = AppError.fromCause(error);
  if (appError.message === appError.title) {
    toastQueryError(appError.title, undefined);
    return;
  }
  toastQueryError(appError.title, appError.message);
}

function shouldRetryQuery(failureCount: number, error: Error) {
  if (error instanceof AppError && error.status < 500) {
    return false;
  }
  return failureCount < 3;
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: notifyFromError,
    }),
    mutationCache: new MutationCache({
      onError: notifyFromError,
    }),
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
    },
  });
}

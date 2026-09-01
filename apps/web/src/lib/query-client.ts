import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { AppError } from "@v-monorepo/shared";
import { toast } from "@v-monorepo/ui/components/toast";

const toastQueryError = (title: string, description?: string) => {
  if (description === undefined) {
    toast.add({ priority: "high", title, type: "error" });
    return;
  }
  toast.add({ description, priority: "high", title, type: "error" });
};

const notifyFromError = (error: Error) => {
  const appError = AppError.fromCause(error);
  if (appError.message === appError.title) {
    toastQueryError(appError.title);
    return;
  }
  toastQueryError(appError.title, appError.message);
};

const shouldRetryQuery = (failureCount: number, error: Error) => {
  if (error instanceof AppError && error.status < 500) {
    return false;
  }
  return failureCount < 3;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
    },
    mutationCache: new MutationCache({
      onError: notifyFromError,
    }),
    queryCache: new QueryCache({
      onError: notifyFromError,
    }),
  });

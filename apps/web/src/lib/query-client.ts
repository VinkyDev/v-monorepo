import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { AppError } from "@v-monorepo/shared";
import { toast } from "@v-monorepo/ui/components/toast";

export type NotifyQueryError = (title: string, description: string | undefined) => void;

function toastQueryError(title: string, description: string | undefined) {
  if (description === undefined) {
    toast.add({ type: "error", title, priority: "high" });
    return;
  }
  toast.add({ type: "error", title, description, priority: "high" });
}

function notifyFromError(notify: NotifyQueryError, error: Error) {
  const appError = AppError.fromCause(error);
  if (appError.message === appError.title) {
    notify(appError.title, undefined);
    return;
  }
  notify(appError.title, appError.message);
}

function shouldRetryQuery(failureCount: number, error: Error) {
  if (error instanceof AppError && error.status < 500) {
    return false;
  }
  return failureCount < 3;
}

export function createQueryClient(notify: NotifyQueryError = toastQueryError) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifyFromError(notify, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifyFromError(notify, error);
      },
    }),
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
    },
  });
}

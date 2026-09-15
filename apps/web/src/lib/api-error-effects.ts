import type { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@v-monorepo/shared";
import type { ApiError, ErrorCode } from "@v-monorepo/shared";
import { toast } from "@v-monorepo/ui/components/toast";

/** A listed code is owned end to end here; call sites neither branch on it nor show it. */
const apiErrorEffects: Partial<
  Record<ErrorCode, (error: ApiError, queryClient: QueryClient) => void>
> = {
  session_expired: (error, queryClient) => {
    queryClient.clear();
    toast.add({
      description: error.message,
      priority: "high",
      title: "登录已失效",
      type: "error",
    });
  },
};

/** Returns true once an effect ran, meaning the caller must stay quiet. */
export const runApiErrorEffect = (
  cause: unknown,
  queryClient: QueryClient
): boolean => {
  if (!isApiError(cause)) {
    return false;
  }
  const effect = apiErrorEffects[cause.code];
  if (effect === undefined) {
    return false;
  }
  effect(cause, queryClient);
  return true;
};

import { errorCatalog, isApiError } from "@v-monorepo/shared";

export interface ErrorView {
  message: string;
  /** 只在服务端故障时展示 */
  traceId: string | undefined;
}

export const toErrorView = (cause: unknown): ErrorView => {
  if (!isApiError(cause)) {
    return { message: errorCatalog.internal.message, traceId: undefined };
  }
  return {
    message: cause.message,
    traceId: cause.status >= 500 ? cause.traceId : undefined,
  };
};

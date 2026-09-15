import { errorCatalog, isApiError } from "@v-monorepo/shared";

export interface ErrorView {
  message: string;
  /** Shown only for server faults, which is when support needs it to find the log. */
  traceId: string | undefined;
}

/**
 * The only place an arbitrary throw turns into user-facing copy, so nothing
 * upstream has to pretend a render crash is an API failure to get a message.
 */
export const toErrorView = (cause: unknown): ErrorView => {
  if (!isApiError(cause)) {
    return { message: errorCatalog.internal.message, traceId: undefined };
  }
  return {
    message: cause.message,
    traceId: cause.status >= 500 ? cause.traceId : undefined,
  };
};

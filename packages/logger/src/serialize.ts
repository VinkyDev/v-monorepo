import { isApiError } from "@v-monorepo/shared";

const STACK_LIMIT = 2048;

export const safeJson = (cause: unknown): string => {
  try {
    return JSON.stringify(cause) ?? String(cause);
  } catch {
    return "[unserializable]";
  }
};

export const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(safeJson(cause));

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
  code?: string;
  status?: number;
  traceId?: string;
  request?: string;
}

const describeCause = (cause: unknown): string =>
  cause instanceof Error ? `${cause.name}: ${cause.message}` : safeJson(cause);

export const serializeError = (cause: unknown): SerializedError => {
  if (!(cause instanceof Error)) {
    return { message: safeJson(cause), name: "NonError" };
  }

  const serialized: SerializedError = {
    cause: cause.cause === undefined ? undefined : describeCause(cause.cause),
    message: cause.message,
    name: cause.name,
    stack: cause.stack?.slice(0, STACK_LIMIT),
  };
  if (!isApiError(cause)) {
    return serialized;
  }
  return {
    ...serialized,
    code: cause.code,
    request:
      cause.request === undefined
        ? undefined
        : `${cause.request.method} ${cause.request.path}`,
    status: cause.status,
    traceId: cause.traceId,
  };
};

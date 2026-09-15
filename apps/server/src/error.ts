import { logger } from "@v-monorepo/logger";
import { ApiError, codeForStatus, isApiError } from "@v-monorepo/shared";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RequestIdVariables } from "hono/request-id";

export interface AppEnv {
  Variables: RequestIdVariables;
}

/** 4xx messages are written by us and safe to show; 5xx ones can leak internals. */
const fromFrameworkError = (cause: Error): ApiError => {
  if (!(cause instanceof HTTPException)) {
    return new ApiError("internal", { cause });
  }
  return new ApiError(codeForStatus(cause.status), {
    cause,
    message: cause.status < 500 ? cause.message : undefined,
  });
};

/** The only place a failure becomes a response, so every 5xx is logged exactly once. */
export const handleError = (cause: Error, c: Context<AppEnv>): Response => {
  const error = isApiError(cause) ? cause : fromFrameworkError(cause);

  if (error.status >= 500) {
    logger.error({
      error: cause,
      event: "api_request_failed",
      message: `${c.req.method} ${c.req.path} -> ${error.status}`,
      meta: {
        code: error.code,
        requestId: c.get("requestId"),
        status: error.status,
      },
    });
  }

  return c.json(error.toBody(), error.status);
};

import { createRequestId, isValidRequestId, REQUEST_ID_HEADER } from "@v-monorepo/shared";
import type { MiddlewareHandler } from "hono";
import { logger } from "hono/logger";
import type { RequestIdVariables } from "hono/request-id";
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

export function assignRequestId(): MiddlewareHandler<{ Variables: RequestIdVariables }> {
  return async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER);
    const id = incoming && isValidRequestId(incoming) ? incoming : createRequestId();
    c.set("requestId", id);
    c.header(REQUEST_ID_HEADER, id);
    await requestContext.run({ requestId: id }, next);
  };
}

export function requestLogger() {
  return logger((message, ...rest) => {
    const requestId = requestContext.getStore()?.requestId;
    if (requestId) {
      console.info(`[${requestId}] ${message}`, ...rest);
      return;
    }
    console.info(message, ...rest);
  });
}

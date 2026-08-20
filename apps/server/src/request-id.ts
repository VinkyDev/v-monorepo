import { log } from "@v-monorepo/logger";
import { createRequestId, isValidRequestId, REQUEST_ID_HEADER } from "@v-monorepo/shared";
import type { MiddlewareHandler } from "hono";
import type { RequestIdVariables } from "hono/request-id";

export function assignRequestId(): MiddlewareHandler<{ Variables: RequestIdVariables }> {
  return async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER);
    const id = incoming && isValidRequestId(incoming) ? incoming : createRequestId();
    c.set("requestId", id);
    c.header(REQUEST_ID_HEADER, id);
    await log.runInContext({ requestId: id }, next);
  };
}

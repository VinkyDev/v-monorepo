import { logger } from "@v-monorepo/logger";
import { ApiError, BODY_LIMIT_BYTES } from "@v-monorepo/shared";
import { Hono } from "hono";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as httpLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";

import { api } from "#/api.ts";
import { handleError } from "#/lib/error.ts";
import type { AppEnv } from "#/lib/error.ts";
import { docsRoutes } from "#/lib/openapi.ts";

export const createApp = () =>
  new Hono<AppEnv>()
    // First, so `X-Request-Id` is on every response and in every error log.
    .use(requestId())
    .use(
      httpLogger((message, ...rest) => {
        logger.info({
          event: "http_request",
          message: [message, ...rest].join(" "),
        });
      })
    )
    .use(secureHeaders({ crossOriginResourcePolicy: "cross-origin" }))
    .use(compress())
    .use(
      bodyLimit({
        maxSize: BODY_LIMIT_BYTES,
        // `bodyLimit` hands back an untyped context; name ours so the log keeps its variables.
        onError: (c: Context<AppEnv>) =>
          handleError(new ApiError("payload_too_large"), c),
      })
    )
    .use("/api/*", timeout(10_000))
    .use("/api/*", cors({ origin: "*" }))
    .route("/api", api)
    .route("/", docsRoutes)
    .notFound((c) => handleError(new ApiError("not_found"), c))
    .onError(handleError);

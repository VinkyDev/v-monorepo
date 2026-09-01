import { swaggerUI } from "@hono/swagger-ui";
import { log } from "@v-monorepo/logger";
import { BODY_LIMIT_BYTES, REQUEST_ID_HEADER } from "@v-monorepo/shared";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { RequestIdVariables } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";

import { api } from "./api.ts";
import {
  handleAppError,
  notFoundProblem,
  payloadTooLargeProblem,
} from "./problem.ts";
import { assignRequestId } from "./request-id.ts";

interface AppEnv {
  Variables: RequestIdVariables;
}

export const createApp = () => {
  const app = new Hono<AppEnv>()
    .use(assignRequestId())
    .use(
      logger((message, ...rest) => {
        log.info(message, ...rest);
      })
    )
    .use(
      secureHeaders({
        crossOriginResourcePolicy: "cross-origin",
      })
    )
    .use(compress())
    .use(
      bodyLimit({
        maxSize: BODY_LIMIT_BYTES,
        onError: payloadTooLargeProblem,
      })
    )
    .use("/api/*", timeout(10_000))
    .use(
      "/api/*",
      cors({
        exposeHeaders: [REQUEST_ID_HEADER],
        origin: "*",
      })
    )
    .route("/api", api);

  app.get(
    "/openapi.json",
    openAPIRouteHandler(api, {
      documentation: {
        info: {
          description:
            "Hono RPC routes. Client types come from AppType via @v-monorepo/api-client.",
          title: "v-monorepo API",
          version: "0.0.0",
        },
        servers: [{ description: "API base path", url: "/api" }],
      },
    })
  );
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  app.notFound(notFoundProblem);
  app.onError(handleAppError);

  return app;
};

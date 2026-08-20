import { swaggerUI } from "@hono/swagger-ui";
import { log } from "@v-monorepo/logger";
import { BODY_LIMIT_BYTES, REQUEST_ID_HEADER } from "@v-monorepo/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { RequestIdVariables } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { openAPIRouteHandler } from "hono-openapi";
import { env } from "./env.ts";
import { handleAppError, notFoundProblem, payloadTooLargeProblem } from "./problem.ts";
import { assignRequestId } from "./request-id.ts";
import { healthRoutes } from "./routes/health/index.ts";

type AppEnv = {
  Variables: RequestIdVariables;
};

const api = new Hono().route("/health", healthRoutes);

export type AppType = typeof api;

export function createApp() {
  const app = new Hono<AppEnv>()
    .use(assignRequestId())
    .use(
      logger((message, ...rest) => {
        log.info(message, ...rest);
      }),
    )
    .use(
      secureHeaders({
        // API is consumed cross-origin by the Vite app.
        crossOriginResourcePolicy: "cross-origin",
      }),
    )
    .use(compress())
    .use(
      bodyLimit({
        maxSize: BODY_LIMIT_BYTES,
        onError: (c) => payloadTooLargeProblem(c),
      }),
    )
    .use("/api/*", timeout(10_000))
    .use(
      "/api/*",
      cors({
        origin: env.CORS_ORIGINS,
        exposeHeaders: [REQUEST_ID_HEADER],
      }),
    )
    .route("/api", api);

  app.get(
    "/openapi.json",
    openAPIRouteHandler(api, {
      documentation: {
        info: {
          title: "v-monorepo API",
          version: "0.0.0",
          description:
            "Hono RPC routes. Client types come from AppType via @v-monorepo/api-client.",
        },
        servers: [{ url: "/api", description: "API base path" }],
      },
    }),
  );
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  app.notFound(notFoundProblem);
  app.onError(handleAppError);

  return app;
}

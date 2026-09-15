import { swaggerUI } from "@hono/swagger-ui";
import { errorBodySchema } from "@v-monorepo/shared";
import { Hono } from "hono";
import { ALLOWED_METHODS, openAPIRouteHandler, resolver } from "hono-openapi";

import { api } from "#/api.ts";

const errorResponse = (description: string) => ({
  content: { "application/json": { schema: resolver(errorBodySchema) } },
  description,
});

const errorResponsesForEveryRoute = Object.fromEntries(
  ALLOWED_METHODS.map((method) => [
    method,
    {
      responses: {
        "4XX": { $ref: "#/components/responses/ClientError" },
        "5XX": { $ref: "#/components/responses/ServerError" },
      },
    },
  ])
);

export const docsRoutes = new Hono()
  .get(
    "/openapi.json",
    openAPIRouteHandler(api, {
      defaultOptions: errorResponsesForEveryRoute,
      documentation: {
        components: {
          responses: {
            ClientError: errorResponse(
              "请求被拒绝。按 `code` 分支，`data` 的形状由 `code` 决定。"
            ),
            ServerError: errorResponse(
              "服务端错误。排障用的 trace id 在 `X-Request-Id` 响应头。"
            ),
          },
        },
        info: {
          description:
            "Hono RPC routes. Client types come from AppType via @v-monorepo/api-client.",
          title: "v-monorepo API",
          version: "0.0.0",
        },
        servers: [{ description: "API base path", url: "/api" }],
      },
    })
  )
  .get("/docs", swaggerUI({ url: "/openapi.json" }));

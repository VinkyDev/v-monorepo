import { healthStatusSchema } from "@v-monorepo/shared";
import type { HealthStatus } from "@v-monorepo/shared";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";

const getHealthStatus = (): HealthStatus => ({
  status: "ok",
  service: "v-monorepo-server",
  timestamp: new Date().toISOString(),
});

export const healthRoutes = new Hono().get(
  "/",
  describeRoute({
    tags: ["Health"],
    summary: "Health check",
    description:
      "Returns service health status for liveness probes and RPC demos.",
    responses: {
      200: {
        description: "Service is healthy",
        content: {
          "application/json": {
            schema: resolver(healthStatusSchema),
          },
        },
      },
    },
  }),
  (c) => c.json(getHealthStatus())
);

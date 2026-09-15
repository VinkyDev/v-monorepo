import { Hono } from "hono";

import { demoRoutes } from "#/routes/demo.ts";
import { healthRoutes } from "#/routes/health.ts";

export const api = new Hono()
  .route("/health", healthRoutes)
  .route("/demo", demoRoutes);

export type AppType = typeof api;

import { Hono } from "hono";

import { demoRoutes } from "./routes/demo/index.ts";
import { healthRoutes } from "./routes/health/index.ts";

export const api = new Hono()
  .route("/health", healthRoutes)
  .route("/demo", demoRoutes);

export type AppType = typeof api;

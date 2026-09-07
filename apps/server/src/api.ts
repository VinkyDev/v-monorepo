import { Hono } from "hono";

import { healthRoutes } from "./routes/health/index.ts";
import { itemRoutes } from "./routes/items/index.ts";

export const api = new Hono()
  .route("/health", healthRoutes)
  .route("/items", itemRoutes);

export type AppType = typeof api;

import { Hono } from "hono";
import { healthRoutes } from "./routes/health/index.ts";

export const api = new Hono().route("/health", healthRoutes);

export type AppType = typeof api;

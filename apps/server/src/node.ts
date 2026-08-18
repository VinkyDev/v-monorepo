import { serve } from "@hono/node-server";
import app from "./index.ts";
import { env } from "./env.ts";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const origin = `http://localhost:${info.port}`;
  console.info(`API server listening on ${origin}`);
  console.info(`Swagger UI: ${origin}/docs`);
  console.info(`OpenAPI spec: ${origin}/openapi.json`);
});

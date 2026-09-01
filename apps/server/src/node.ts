import { serve } from "@hono/node-server";
import { log } from "@v-monorepo/logger";

import { env } from "./env.ts";
import app from "./index.ts";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const origin = `http://localhost:${info.port}`;
  log.info(`API server listening on ${origin}`);
  log.info(`Swagger UI: ${origin}/docs`);
  log.info(`OpenAPI spec: ${origin}/openapi.json`);
});

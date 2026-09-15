import { serve } from "@hono/node-server";
import { addSink, consoleSink, logger } from "@v-monorepo/logger";

import { env } from "./env.ts";
import app from "./index.ts";

addSink(consoleSink);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const origin = `http://localhost:${info.port}`;
  logger.info({
    event: "server_listening",
    message: `API server listening on ${origin}`,
    meta: {
      docs: `${origin}/docs`,
      openapi: `${origin}/openapi.json`,
    },
  });
});

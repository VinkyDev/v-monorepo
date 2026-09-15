import { serve } from "@hono/node-server";
import { addSink, consoleSink, logger } from "@v-monorepo/logger";

import { createApp } from "#/app.ts";
import { env } from "#/env.ts";

addSink(consoleSink);

serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
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

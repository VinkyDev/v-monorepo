import { addSink, consoleSink } from "@v-monorepo/logger";

import { createApp } from "#/app.ts";

// The Vite dev entry. Like every entry point, it composes its own sinks.
addSink(consoleSink);

export default createApp();

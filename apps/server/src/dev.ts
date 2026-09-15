import { addSink, consoleSink } from "@v-monorepo/logger";

import { createApp } from "#/app.ts";

addSink(consoleSink);

export default createApp();

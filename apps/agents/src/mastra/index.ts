import { Mastra } from "@mastra/core";
import { MastraEditor } from "@mastra/editor";
import {
  MastraPlatformExporter,
  MastraStorageExporter,
  Observability,
} from "@mastra/observability";
import { PostgresStoreVNext } from "@mastra/pg";

import { parseEnv } from "#/env.ts";

import { helloAgent } from "./agents/hello.ts";

const env = parseEnv(process.env);

export const mastra = new Mastra({
  agents: { helloAgent },
  editor: new MastraEditor(),
  observability: new Observability({
    configs: {
      default: {
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        serviceName: "agents",
      },
    },
  }),
  storage: new PostgresStoreVNext({
    id: "agents-storage",
    connectionString: env.DATABASE_URL,
    observability: {
      connectionString: env.DATABASE_URL,
    },
  }),
});

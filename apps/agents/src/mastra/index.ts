import { chatRoute } from "@mastra/ai-sdk";
import { Mastra } from "@mastra/core";
import { MastraEditor } from "@mastra/editor";
import {
  MastraPlatformExporter,
  MastraStorageExporter,
  Observability,
} from "@mastra/observability";
import { PostgresStoreVNext } from "@mastra/pg";

import { parseEnv } from "#/env.ts";

import { researchAgent } from "./agents/research.ts";
import { customGateway } from "./providers/custom.ts";

const env = parseEnv(process.env);

export const mastra = new Mastra({
  agents: { researchAgent },
  gateways: { custom: customGateway },
  server: {
    apiRoutes: [
      chatRoute({
        path: "/chat/:agentId",
        heartbeatMs: 15_000,
        sendReasoning: true,
        sendSources: true,
        version: "v7",
      }),
    ],
    host: "127.0.0.1",
  },
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

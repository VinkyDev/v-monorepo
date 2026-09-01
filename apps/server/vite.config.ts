import devServer from "@hono/vite-dev-server";
import { nodeAdapter } from "@hono/vite-dev-server/node";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";

import { parseEnv } from "./src/env.ts";

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const { PORT: port } = parseEnv(loaded);

  return {
    build: {
      outDir: "dist",
      rolldownOptions: {
        output: {
          entryFileNames: "server.mjs",
          format: "es",
        },
      },
      ssr: "src/node.ts",
      target: "node22",
    },
    plugins: lazyPlugins(() => [
      devServer({
        adapter: nodeAdapter,
        entry: "src/index.ts",
      }),
    ]),
    publicDir: false,
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
    },
    ssr: {
      noExternal: true,
    },
  };
});

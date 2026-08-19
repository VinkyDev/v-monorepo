import { join } from "node:path";
import devServer from "@hono/vite-dev-server";
import nodeAdapter from "@hono/vite-dev-server/node";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";
import { parseEnv } from "./src/env.ts";

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const { PORT: port } = parseEnv(loaded);

  return {
    resolve: {
      alias: {
        "@": join(import.meta.dirname, "src"),
      },
    },
    server: {
      port,
      strictPort: true,
    },
    plugins: lazyPlugins(() => [
      devServer({
        adapter: nodeAdapter,
        entry: "src/index.ts",
      }),
    ]),
    publicDir: false,
    build: {
      ssr: "src/node.ts",
      target: "node22",
      outDir: "dist",
      rollupOptions: {
        output: {
          format: "es",
          entryFileNames: "server.mjs",
        },
      },
    },
    ssr: {
      noExternal: [/^@v-monorepo\//],
    },
  };
});

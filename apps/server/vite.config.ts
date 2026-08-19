import { join } from "node:path";
import devServer from "@hono/vite-dev-server";
import nodeAdapter from "@hono/vite-dev-server/node";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";

function readPort(value: string | undefined): number {
  const port = Number(value === undefined || value === "" ? 3001 : value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const port = readPort(loaded.PORT);

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

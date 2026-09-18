import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv, defineConfig, lazyPlugins } from "vite-plus";
import { z } from "zod";

const devEnvSchema = z.object({
  AGENTS_ORIGIN: z.url().default("http://127.0.0.1:4111"),
  API_ORIGIN: z.url().default("http://127.0.0.1:3001"),
});

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const { AGENTS_ORIGIN: agentsOrigin, API_ORIGIN: apiOrigin } =
    devEnvSchema.parse(loaded);

  return {
    plugins: lazyPlugins(() => [
      tanstackRouter({
        autoCodeSplitting: true,
        quoteStyle: "double",
        target: "react",
      }),
      tailwindcss(),
      react({ compiler: true }),
    ]),
    server: {
      hmr: {
        clientPort: 5173,
        host: "127.0.0.1",
        protocol: "ws",
      },
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/chat": {
          changeOrigin: true,
          target: agentsOrigin,
        },
        "/api/memory": {
          changeOrigin: true,
          target: agentsOrigin,
        },
        "/api": {
          changeOrigin: true,
          target: apiOrigin,
        },
      },
    },
  };
});

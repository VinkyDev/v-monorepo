import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite-plus";
import { defineConfig, lazyPlugins } from "vite-plus";
import { z } from "zod";

const devEnvSchema = z.object({
  API_ORIGIN: z.url().default("http://127.0.0.1:3001"),
});

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const { API_ORIGIN: apiOrigin } = devEnvSchema.parse(loaded);

  return {
    server: {
      host: "127.0.0.1",
      port: 5173,
      hmr: {
        host: "127.0.0.1",
        protocol: "ws",
        clientPort: 5173,
      },
      proxy: {
        "/api": {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    plugins: lazyPlugins(() => [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        quoteStyle: "double",
      }),
      tailwindcss(),
      react(),
    ]),
  };
});

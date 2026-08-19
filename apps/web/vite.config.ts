import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite-plus";
import { defineConfig, lazyPlugins } from "vite-plus";
import { z } from "zod";

const devEnvSchema = z.object({
  DEV_API_ORIGIN: z.url().default("http://localhost:3001"),
});

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const { DEV_API_ORIGIN: devApiOrigin } = devEnvSchema.parse(loaded);

  return {
    resolve: {
      alias: {
        "@": join(import.meta.dirname, "src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: devApiOrigin,
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

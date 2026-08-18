import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite-plus";
import { defineConfig, lazyPlugins } from "vite-plus";

function readDevApiOrigin(value: string | undefined): string {
  const origin = value === undefined || value === "" ? "http://localhost:3001" : value;
  if (!URL.canParse(origin)) {
    throw new Error(`Invalid DEV_API_ORIGIN: ${origin}`);
  }
  return origin;
}

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, import.meta.dirname, "");
  const devApiOrigin = readDevApiOrigin(loaded.DEV_API_ORIGIN);

  return {
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

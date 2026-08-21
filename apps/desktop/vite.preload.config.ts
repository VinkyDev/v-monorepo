import { join } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
  publicDir: false,
  resolve: {
    alias: {
      "@": join(import.meta.dirname, "src"),
    },
  },
  build: {
    ssr: true,
    target: "node22",
    outDir: "dist/preload",
    emptyOutDir: mode !== "development",
    minify: mode !== "development",
    sourcemap: mode === "development",
    lib: {
      entry: join(import.meta.dirname, "src/preload/index.ts"),
      formats: ["cjs"],
      fileName: () => "index.cjs",
    },
    rollupOptions: {
      external: ["electron"],
    },
  },
}));

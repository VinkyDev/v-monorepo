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
    outDir: "dist/main",
    emptyOutDir: mode !== "development",
    minify: mode !== "development",
    sourcemap: mode === "development",
    lib: {
      entry: join(import.meta.dirname, "src/main/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["electron"],
    },
  },
}));

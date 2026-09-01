import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
  build: {
    emptyOutDir: mode !== "development",
    lib: {
      entry: path.join(import.meta.dirname, "src/main/index.ts"),
      fileName: () => "index.js",
      formats: ["es"],
    },
    minify: mode !== "development",
    outDir: "dist/main",
    rolldownOptions: {
      external: ["electron"],
    },
    sourcemap: mode === "development",
    ssr: true,
    target: "node22",
  },
  publicDir: false,
}));

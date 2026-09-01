import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
  build: {
    emptyOutDir: mode !== "development",
    lib: {
      entry: path.join(import.meta.dirname, "src/preload/index.ts"),
      fileName: () => "index.cjs",
      formats: ["cjs"],
    },
    minify: mode !== "development",
    outDir: "dist/preload",
    rolldownOptions: {
      external: ["electron"],
    },
    sourcemap: mode === "development",
    ssr: true,
    target: "node22",
  },
  publicDir: false,
}));

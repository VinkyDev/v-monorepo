import { join } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": join(import.meta.dirname, "src"),
    },
  },
  pack: {
    entry: {
      index: "src/index.ts",
      compat: "src/compat.ts",
    },
    dts: {
      tsgo: true,
    },
    exports: true,
  },
});

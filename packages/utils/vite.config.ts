import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: true,
    entry: {
      index: "src/index.ts",
    },
    exports: true,
  },
});

import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      cn: "src/cn.ts",
      array: "src/array.ts",
      bigint: "src/bigint.ts",
      compat: "src/compat.ts",
      error: "src/error.ts",
      fp: "src/fp.ts",
      function: "src/function.ts",
      map: "src/map.ts",
      math: "src/math.ts",
      object: "src/object.ts",
      predicate: "src/predicate.ts",
      promise: "src/promise.ts",
      server: "src/server.ts",
      set: "src/set.ts",
      string: "src/string.ts",
      types: "src/types.ts",
      util: "src/util.ts",
    },
    dts: {
      tsgo: true,
    },
    exports: true,
  },
});

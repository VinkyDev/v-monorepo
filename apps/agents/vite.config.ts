import { flue } from "@flue/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: process.env.VITEST === undefined ? [flue()] : [],
  server: {
    port: 5174,
  },
});

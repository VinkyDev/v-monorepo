import { flue } from "@flue/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  server: {
    port: 5174,
  },
  plugins: [flue()],
});

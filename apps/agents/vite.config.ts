import { flue } from "@flue/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [flue()],
  server: {
    port: 5174,
  },
});

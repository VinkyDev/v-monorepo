import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_BASE_URL: z.string().min(1).default("/api"),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});

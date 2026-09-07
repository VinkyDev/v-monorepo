import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    VITE_API_BASE_URL: z.string().min(1).default("/api"),
    VITE_MAX_RETRY_COUNT: z.number().min(1).default(1),
  },
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  runtimeEnv: import.meta.env,
});

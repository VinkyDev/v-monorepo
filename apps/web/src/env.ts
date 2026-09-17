import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    VITE_AGUI_URL: z.string().min(1).default("/agui/research-agent"),
    VITE_API_BASE_URL: z.string().min(1).default("/api"),
    VITE_MAX_RETRY_COUNT: z.coerce.number().int().min(0).default(1),
    VITE_MEMORY_URL: z.string().min(1).default("/memory/research-agent"),
  },
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  runtimeEnv: import.meta.env,
});

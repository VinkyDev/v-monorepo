import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const parseEnv = (runtimeEnv: Record<string, string | undefined>) =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv,
    server: {
      CUSTOM_API_KEY: z.string().min(1).optional(),
      CUSTOM_BASE_URL: z.url().optional(),
      CUSTOM_MODEL_LIST: z.string().min(1).optional(),
      DATABASE_URL: z.url(),
    },
  });

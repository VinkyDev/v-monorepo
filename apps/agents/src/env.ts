import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const parseEnv = (runtimeEnv: Record<string, string | undefined>) =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv,
    server: {
      DATABASE_URL: z.url(),
    },
  });

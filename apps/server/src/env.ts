import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const parseEnv = (runtimeEnv: Record<string, string | undefined>) =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv,
    server: {
      PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    },
  });

export const env = parseEnv(process.env);

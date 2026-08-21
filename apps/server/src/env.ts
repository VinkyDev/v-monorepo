import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const serverSchema = {
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
};

export function parseEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    server: serverSchema,
    runtimeEnv,
    emptyStringAsUndefined: true,
  });
}

export const env = parseEnv(process.env);

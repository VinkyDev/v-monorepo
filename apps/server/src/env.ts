import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const corsOriginsSchema = z
  .string()
  .default("http://localhost:5173,http://localhost:4173")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(z.array(z.url()).min(1));

const serverSchema = {
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: corsOriginsSchema,
};

export function parseEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    server: serverSchema,
    runtimeEnv,
    emptyStringAsUndefined: true,
  });
}

export const env = parseEnv(process.env);

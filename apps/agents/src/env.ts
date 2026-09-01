import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const compatProviderIds = ["anthropic-compat", "openai-compat"] as const;

export type CompatProviderId = (typeof compatProviderIds)[number];

export const isCompatProvider = (
  providerId: string
): providerId is CompatProviderId =>
  compatProviderIds.some((id) => id === providerId);

const serverSchema = {
  API_KEY: z.string().min(1),
  BASE_URL: z.url().optional(),
  MODEL_ID: z.string().min(1),
  PROVIDER_ID: z.string().min(1),
};

export const parseEnv = (runtimeEnv: Record<string, string | undefined>) => {
  const env = createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv,
    server: serverSchema,
  });

  if (isCompatProvider(env.PROVIDER_ID) && env.BASE_URL === undefined) {
    throw new Error(
      `BASE_URL is required when PROVIDER_ID is ${env.PROVIDER_ID}`
    );
  }

  return env;
};

export type Env = ReturnType<typeof parseEnv>;

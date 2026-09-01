import { createProvider, envApiKeyAuth } from "@earendil-works/pi-ai";
import type { Api, Model, Provider } from "@earendil-works/pi-ai";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import {
  getBuiltinModels,
  getBuiltinProviders,
} from "@earendil-works/pi-ai/providers/all";
import type { BuiltinProvider } from "@earendil-works/pi-ai/providers/all";

import { isCompatProvider } from "#/env.ts";
import type { CompatProviderId, Env } from "#/env.ts";

const zeroCost = {
  cacheRead: 0,
  cacheWrite: 0,
  input: 0,
  output: 0,
} as const;

const fallbackLimits = {
  contextWindow: 128_000,
  maxTokens: 8192,
} as const;

const preferredCatalog = {
  "anthropic-compat": ["anthropic"],
  "openai-compat": ["openai"],
} as const satisfies Record<CompatProviderId, readonly BuiltinProvider[]>;

const nativeApiKeyEnv = new Map([
  ["anthropic", "ANTHROPIC_API_KEY"],
  ["cloudflare-ai-gateway", "CLOUDFLARE_API_KEY"],
  ["cloudflare-workers-ai", "CLOUDFLARE_API_KEY"],
  ["github-copilot", "COPILOT_GITHUB_TOKEN"],
  ["google", "GEMINI_API_KEY"],
  ["huggingface", "HF_TOKEN"],
  ["kimi-coding", "KIMI_API_KEY"],
  ["moonshotai-cn", "MOONSHOT_API_KEY"],
  ["opencode-go", "OPENCODE_API_KEY"],
  ["vercel-ai-gateway", "AI_GATEWAY_API_KEY"],
]);

export const nativeApiKeyEnvVar = (providerId: string) =>
  nativeApiKeyEnv.get(providerId) ??
  `${providerId.replaceAll("-", "_").toUpperCase()}_API_KEY`;

export const applyNativeApiKey = (env: Env) => {
  process.env[nativeApiKeyEnvVar(env.PROVIDER_ID)] = env.API_KEY;
};

const modelIdMatches = (entryId: string, modelId: string) =>
  entryId === modelId || entryId.endsWith(`/${modelId}`);

export const catalogModelFor = (
  modelId: string,
  compatProviderId: CompatProviderId
): Model<Api> | undefined => {
  const preferred = preferredCatalog[compatProviderId];
  const preferredIds = new Set<string>(preferred);
  const providers = [
    ...preferred,
    ...getBuiltinProviders().filter((id) => !preferredIds.has(id)),
  ];

  for (const provider of providers) {
    const match = getBuiltinModels(provider).find((entry) =>
      modelIdMatches(entry.id, modelId)
    );
    if (match !== undefined) {
      return match;
    }
  }

  return undefined;
};

export const modelSpecifier = (env: Pick<Env, "MODEL_ID" | "PROVIDER_ID">) =>
  `${env.PROVIDER_ID}/${env.MODEL_ID}`;

export const createCompatProvider = (env: Env): Provider => {
  const providerId = env.PROVIDER_ID;
  if (!isCompatProvider(providerId)) {
    throw new Error(`Expected a compat PROVIDER_ID, got ${providerId}`);
  }

  const baseUrl = env.BASE_URL;
  if (baseUrl === undefined) {
    throw new Error(`BASE_URL is required when PROVIDER_ID is ${providerId}`);
  }

  const openai = providerId === "openai-compat";
  const catalog = catalogModelFor(env.MODEL_ID, providerId);

  return createProvider({
    api: openai ? openAICompletionsApi() : anthropicMessagesApi(),
    auth: { apiKey: envApiKeyAuth("API key", ["API_KEY"]) },
    baseUrl,
    id: providerId,
    models: [
      {
        api: openai ? "openai-completions" : "anthropic-messages",
        baseUrl,
        contextWindow: catalog?.contextWindow ?? fallbackLimits.contextWindow,
        cost: catalog?.cost ?? zeroCost,
        id: env.MODEL_ID,
        input: catalog?.input ?? ["text"],
        maxTokens: catalog?.maxTokens ?? fallbackLimits.maxTokens,
        name: catalog?.name ?? env.MODEL_ID,
        provider: providerId,
        reasoning: catalog?.reasoning ?? false,
        thinkingLevelMap: catalog?.thinkingLevelMap,
      },
    ],
    name: providerId,
  });
};

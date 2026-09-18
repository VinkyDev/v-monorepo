import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type {
  GatewayLanguageModel,
  MastraModelGatewayInterface,
} from "@mastra/core/llm";

const id = "custom";

const read = (
  key: "CUSTOM_API_KEY" | "CUSTOM_BASE_URL" | "CUSTOM_MODEL_LIST"
): string | undefined => {
  const value = process.env[key];
  return value !== undefined && value.length > 0 ? value : undefined;
};

const modelIds = (): string[] =>
  (read("CUSTOM_MODEL_LIST") ?? "")
    .split(/[,;\n]/u)
    .map((model) => model.trim())
    .filter((model) => model.length > 0);

const baseURL = (): string | undefined =>
  read("CUSTOM_BASE_URL")?.replace(/\/$/u, "");

export const customGateway: MastraModelGatewayInterface = {
  id,
  name: "Custom",
  shouldEnable: () => read("CUSTOM_BASE_URL") !== undefined,
  async fetchProviders() {
    const url = await Promise.resolve(baseURL());
    return {
      [id]: {
        apiKeyEnvVar: "CUSTOM_API_KEY",
        gateway: id,
        models: modelIds(),
        name: "Custom",
        url,
      },
    };
  },
  buildUrl() {
    return baseURL();
  },
  async getApiKey(modelId: string) {
    const apiKey = await Promise.resolve(read("CUSTOM_API_KEY"));
    if (apiKey === undefined) {
      throw new Error(
        `Missing CUSTOM_API_KEY environment variable for model: ${modelId}`
      );
    }
    return apiKey;
  },
  resolveLanguageModel({ modelId, providerId, apiKey, headers }) {
    const url = baseURL();
    if (url === undefined) {
      throw new Error("Missing CUSTOM_BASE_URL environment variable");
    }
    const model = createOpenAICompatible({
      apiKey,
      baseURL: url,
      headers,
      name: providerId,
      supportsStructuredOutputs: true,
    }).chatModel(modelId);
    // SAFETY: chatModel is specificationVersion "v4". GatewayLanguageModel includes
    // Mastra's vendored LanguageModelV4 (@ai-sdk/provider@4.0.4); openai-compatible
    // 3.0.51 types the same v4 model from 4.0.17, where JSONValue became Readonly.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return model as GatewayLanguageModel;
  },
};

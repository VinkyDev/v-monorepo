import { describe, expect, test } from "vite-plus/test";

import { parseEnv } from "#/env.ts";
import {
  applyNativeApiKey,
  createCompatProvider,
  modelSpecifier,
  nativeApiKeyEnvVar,
} from "#/llm-provider.ts";

const nativeEnv = {
  API_KEY: "sk-test",
  MODEL_ID: "k3-256k",
  PROVIDER_ID: "kimi-coding",
};

describe(parseEnv, () => {
  test("accepts a native Pi provider without BASE_URL", () => {
    expect(parseEnv(nativeEnv)).toMatchObject(nativeEnv);
  });

  test("requires BASE_URL for openai-compat", () => {
    expect(() =>
      parseEnv({
        API_KEY: "sk-test",
        MODEL_ID: "local-model",
        PROVIDER_ID: "openai-compat",
      })
    ).toThrow("BASE_URL is required when PROVIDER_ID is openai-compat");
  });

  test("accepts openai-compat with BASE_URL", () => {
    expect(
      parseEnv({
        API_KEY: "sk-test",
        BASE_URL: "https://api.example.com/v1",
        MODEL_ID: "local-model",
        PROVIDER_ID: "openai-compat",
      })
    ).toMatchObject({
      BASE_URL: "https://api.example.com/v1",
      PROVIDER_ID: "openai-compat",
    });
  });
});

describe(nativeApiKeyEnvVar, () => {
  test("uses Pi's env var names for built-in providers", () => {
    expect(nativeApiKeyEnvVar("kimi-coding")).toBe("KIMI_API_KEY");
    expect(nativeApiKeyEnvVar("openai")).toBe("OPENAI_API_KEY");
  });
});

describe(applyNativeApiKey, () => {
  test("copies API_KEY into the provider's Pi env var", () => {
    const previous = process.env.KIMI_API_KEY;
    try {
      applyNativeApiKey(parseEnv(nativeEnv));
      expect(process.env.KIMI_API_KEY).toBe("sk-test");
    } finally {
      if (previous === undefined) {
        delete process.env.KIMI_API_KEY;
      } else {
        process.env.KIMI_API_KEY = previous;
      }
    }
  });
});

describe(createCompatProvider, () => {
  test("copies contextWindow and maxTokens from the Pi catalog", () => {
    const provider = createCompatProvider(
      parseEnv({
        API_KEY: "sk-test",
        BASE_URL: "https://api.example.com/v1",
        MODEL_ID: "gpt-5.6-luna",
        PROVIDER_ID: "openai-compat",
      })
    );

    expect(provider.getModels()[0]).toMatchObject({
      contextWindow: 272_000,
      id: "gpt-5.6-luna",
      maxTokens: 128_000,
      name: "GPT-5.6 Luna",
    });
  });

  test("falls back when the model id is not in any catalog", () => {
    const provider = createCompatProvider(
      parseEnv({
        API_KEY: "sk-test",
        BASE_URL: "https://api.example.com/v1",
        MODEL_ID: "local-model",
        PROVIDER_ID: "openai-compat",
      })
    );

    expect(provider.id).toBe("openai-compat");
    expect(provider.baseUrl).toBe("https://api.example.com/v1");
    expect(provider.getModels()).toStrictEqual([
      expect.objectContaining({
        api: "openai-completions",
        contextWindow: 128_000,
        id: "local-model",
        maxTokens: 8192,
      }),
    ]);
  });

  test("copies Anthropic catalog limits onto anthropic-compat", () => {
    const provider = createCompatProvider(
      parseEnv({
        API_KEY: "sk-test",
        BASE_URL: "https://api.example.com",
        MODEL_ID: "claude-sonnet-4-6",
        PROVIDER_ID: "anthropic-compat",
      })
    );

    expect(provider.getModels()[0]).toMatchObject({
      api: "anthropic-messages",
      contextWindow: 1_000_000,
      id: "claude-sonnet-4-6",
      maxTokens: 128_000,
    });
  });
});

describe(modelSpecifier, () => {
  test("joins PROVIDER_ID and MODEL_ID", () => {
    expect(modelSpecifier(nativeEnv)).toBe("kimi-coding/k3-256k");
  });
});

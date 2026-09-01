import { setProvider } from "@flue/runtime";

import { isCompatProvider, parseEnv } from "#/env.ts";
import {
  applyNativeApiKey,
  createCompatProvider,
  modelSpecifier,
} from "#/llm-provider.ts";

export const env = parseEnv(process.env);

if (isCompatProvider(env.PROVIDER_ID)) {
  setProvider(createCompatProvider(env));
} else {
  applyNativeApiKey(env);
}

export const llmModel = modelSpecifier(env);

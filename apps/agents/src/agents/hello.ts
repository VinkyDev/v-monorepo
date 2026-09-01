"use agent";
import { useModel } from "@flue/runtime";

import { llmModel } from "#/llm.ts";

export const Hello = () => {
  useModel(llmModel);
  return "You are a helpful assistant. Keep replies short.";
};

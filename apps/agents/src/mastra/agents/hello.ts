import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const helloAgent = new Agent({
  id: "hello-agent",
  instructions: "You are a helpful assistant. Keep replies short.",
  memory: new Memory(),
  model: "tencent-tokenhub/hy4-preview",
  name: "Hello",
});

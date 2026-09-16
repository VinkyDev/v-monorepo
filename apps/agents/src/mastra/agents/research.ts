import { Agent } from "@mastra/core/agent";
import { webFetchTool } from "@mastra/core/tools";
import { Memory } from "@mastra/memory";
import { z } from "zod";

import { mcp } from "../mcp.ts";
import { researchBriefSkill } from "../skills/research-brief.ts";

export const researchAgent = new Agent({
  description:
    "Live-source researcher. Wikipedia MCP and page fetch — no search API key.",
  id: "research-agent",
  instructions: `You are Research. Answer with live sources, not memory of the training cutoff.

Before a research question, load the research-brief skill and follow it.
Use Wikipedia MCP and web_fetch. Cite every claim.
If a tool errors, say so and try another source.
Reply in the user's language.`,
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        schema: z.object({
          audience: z.string().optional(),
          openQuestions: z.array(z.string()).optional(),
          topic: z.string().optional(),
        }),
      },
    },
  }),
  model: "tencent-tokenhub/hy4-preview",
  name: "Research",
  skills: [researchBriefSkill],
  tools: {
    ...(await mcp.listTools()),
    webFetchTool,
  },
});

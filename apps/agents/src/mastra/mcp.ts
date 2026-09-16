import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  id: "research-mcp",
  servers: {
    wikipedia: {
      args: ["-y", "wikipedia-mcp"],
      command: "npx",
    },
  },
});

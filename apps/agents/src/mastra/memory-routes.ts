import type { Mastra } from "@mastra/core";
import type { MastraMemory } from "@mastra/core/memory";
import { registerApiRoute } from "@mastra/core/server";
import { z } from "zod";

import { tryGetAgentById } from "./agui.ts";
import { archivedMetadata, toMemoryThreadItem } from "./memory-threads.ts";
import { publicCors, readResourceId } from "./resource-id.ts";

const patchThreadSchema = z.object({
  archived: z.boolean().optional(),
  title: z.string().min(1).optional(),
});

const tryGetAgentMemory = async (
  mastra: Mastra,
  agentId: string
): Promise<MastraMemory | undefined> => {
  const agent = tryGetAgentById((id) => mastra.getAgentById(id), agentId);
  if (agent === undefined) {
    return undefined;
  }
  return await agent.getMemory();
};

const missingResource = { error: "missing resource id" } as const;

const ownedThread = async (
  memory: MastraMemory,
  resourceId: string,
  threadId: string
) => {
  const thread = await memory.getThreadById({ threadId });
  return thread !== null && thread.resourceId === resourceId
    ? thread
    : undefined;
};

export const listMemoryThreadsRoute = registerApiRoute(
  "/memory/:agentId/threads",
  {
    cors: publicCors,
    handler: async (context) => {
      const resourceId = readResourceId(context.req.raw);
      if (resourceId === undefined) {
        return context.json(missingResource, 400);
      }

      const memory = await tryGetAgentMemory(
        context.get("mastra"),
        context.req.param("agentId")
      );
      if (memory === undefined) {
        return context.json({ error: "agent memory not found" }, 404);
      }

      const result = await memory.listThreads({
        filter: { resourceId },
        orderBy: { direction: "DESC", field: "updatedAt" },
        perPage: false,
      });

      return context.json({
        threads: result.threads.map(toMemoryThreadItem),
      });
    },
    method: "GET",
  }
);

export const deleteMemoryThreadRoute = registerApiRoute(
  "/memory/:agentId/threads/:threadId",
  {
    cors: publicCors,
    handler: async (context) => {
      const resourceId = readResourceId(context.req.raw);
      if (resourceId === undefined) {
        return context.json(missingResource, 400);
      }

      const memory = await tryGetAgentMemory(
        context.get("mastra"),
        context.req.param("agentId")
      );
      if (memory === undefined) {
        return context.json({ error: "agent memory not found" }, 404);
      }

      const thread = await ownedThread(
        memory,
        resourceId,
        context.req.param("threadId")
      );
      if (thread === undefined) {
        return context.json({ error: "thread not found" }, 404);
      }

      await memory.deleteThread(thread.id);
      return context.json({ ok: true });
    },
    method: "DELETE",
  }
);

export const patchMemoryThreadRoute = registerApiRoute(
  "/memory/:agentId/threads/:threadId",
  {
    cors: publicCors,
    handler: async (context) => {
      const resourceId = readResourceId(context.req.raw);
      if (resourceId === undefined) {
        return context.json(missingResource, 400);
      }

      const memory = await tryGetAgentMemory(
        context.get("mastra"),
        context.req.param("agentId")
      );
      if (memory === undefined) {
        return context.json({ error: "agent memory not found" }, 404);
      }

      let body: unknown;
      try {
        body = await context.req.json();
      } catch {
        return context.json({ error: "invalid thread patch" }, 400);
      }

      const parsed = patchThreadSchema.safeParse(body);
      if (!parsed.success) {
        return context.json({ error: "invalid thread patch" }, 400);
      }

      const thread = await ownedThread(
        memory,
        resourceId,
        context.req.param("threadId")
      );
      if (thread === undefined) {
        return context.json({ error: "thread not found" }, 404);
      }

      const updated = await memory.updateThread({
        id: thread.id,
        metadata:
          parsed.data.archived === undefined
            ? undefined
            : archivedMetadata(thread.metadata, parsed.data.archived),
        title: parsed.data.title,
      });

      return context.json(toMemoryThreadItem(updated));
    },
    method: "PATCH",
  }
);

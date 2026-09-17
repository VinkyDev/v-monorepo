import { z } from "zod";

import { env } from "#/env.ts";
import type { RemoteThread } from "#/lib/research-threads.ts";

export const RESOURCE_ID_HEADER = "x-mastra-resource-id";

const remoteThreadSchema = z.object({
  archived: z.boolean(),
  id: z.string().min(1),
  lastMessageAt: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
});

const listResponseSchema = z.object({
  threads: z.array(remoteThreadSchema),
});

const resourceHeaders = (resourceId: string): HeadersInit => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  [RESOURCE_ID_HEADER]: resourceId,
});

const memoryUrl = (threadId?: string): string =>
  threadId === undefined
    ? `${env.VITE_MEMORY_URL}/threads`
    : `${env.VITE_MEMORY_URL}/threads/${threadId}`;

const assertOk = (response: Response): void => {
  if (!response.ok) {
    throw new Error(`memory request failed: ${response.status}`);
  }
};

export const listRemoteThreads = async (
  resourceId: string
): Promise<RemoteThread[]> => {
  const response = await fetch(memoryUrl(), {
    headers: resourceHeaders(resourceId),
  });
  assertOk(response);
  const parsed = listResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("invalid memory thread list");
  }
  return parsed.data.threads;
};

export const deleteRemoteThread = async (
  resourceId: string,
  threadId: string
): Promise<void> => {
  const response = await fetch(memoryUrl(threadId), {
    headers: resourceHeaders(resourceId),
    method: "DELETE",
  });
  assertOk(response);
};

export const patchRemoteThread = async (
  resourceId: string,
  threadId: string,
  patch: { archived?: boolean; title?: string }
): Promise<void> => {
  const response = await fetch(memoryUrl(threadId), {
    body: JSON.stringify(patch),
    headers: resourceHeaders(resourceId),
    method: "PATCH",
  });
  assertOk(response);
};

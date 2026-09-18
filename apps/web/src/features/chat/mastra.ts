import { useAui } from "@assistant-ui/react";
import type {
  RemoteThreadListAdapter,
  RuntimeAdapters,
  ThreadHistoryAdapter,
  ThreadMessage,
} from "@assistant-ui/react";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { MastraClient } from "@mastra/client-js";
import { createAssistantStream } from "assistant-stream";
import { useMemo } from "react";

const RESOURCE_STORAGE_KEY = "assistant-resource-id";

interface ThreadArchiveFields {
  archived?: boolean;
}

type ListedThread = Awaited<
  ReturnType<RemoteThreadListAdapter["list"]>
>["threads"][number];

type MemoryThread = Awaited<
  ReturnType<ReturnType<MastraClient["getMemoryThread"]>["get"]>
>;

let fallbackResourceId: string | undefined;
let cachedResourceId: string | undefined;

const loadResourceId = (): string => {
  if (cachedResourceId !== undefined) {
    return cachedResourceId;
  }
  try {
    const existing = window.localStorage.getItem(RESOURCE_STORAGE_KEY);
    if (existing !== null && existing.length > 0) {
      cachedResourceId = existing;
    } else {
      cachedResourceId = crypto.randomUUID();
      window.localStorage.setItem(RESOURCE_STORAGE_KEY, cachedResourceId);
    }
  } catch {
    fallbackResourceId ??= crypto.randomUUID();
    cachedResourceId = fallbackResourceId;
  }

  return cachedResourceId;
};

let client: MastraClient | undefined;

const getMastraClient = (): MastraClient => {
  client ??= new MastraClient({ baseUrl: globalThis.location.origin });
  return client;
};

export const getChatResourceId = loadResourceId;

const isArchivedMetadata = (metadata?: ThreadArchiveFields): boolean =>
  metadata?.archived === true;

const withArchivedMetadata = (
  metadata: ThreadArchiveFields | undefined,
  archived: boolean
) => ({
  ...metadata,
  archived,
});

const asDate = (value: Date | string): Date | undefined => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toRemoteThreadMetadata = (thread: {
  id: string;
  metadata?: ThreadArchiveFields;
  title?: string;
  updatedAt: Date | string;
}): ListedThread => ({
  lastMessageAt: asDate(thread.updatedAt),
  remoteId: thread.id,
  status: isArchivedMetadata(thread.metadata) ? "archived" : "regular",
  title: thread.title,
});

const archiveThreadUpdate = (
  thread: Pick<MemoryThread, "resourceId" | "title"> & {
    metadata?: ThreadArchiveFields;
  },
  archived: boolean,
  title?: string
) => ({
  metadata: withArchivedMetadata(thread.metadata, archived),
  resourceId: thread.resourceId,
  title: title ?? thread.title ?? "",
});

const clipTitle = (text: string, max = 40): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const titleFromMessages = (
  messages: readonly ThreadMessage[]
): string | undefined => {
  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }
    const text = message.content
      .filter(
        (part): part is { text: string; type: "text" } => part.type === "text"
      )
      .map((part) => part.text)
      .join("")
      .trim();
    if (text.length > 0) {
      return clipTitle(text);
    }
  }
  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }
    const name = message.attachments[0]?.name;
    if (name !== undefined && name.length > 0) {
      return clipTitle(name);
    }
  }
  return undefined;
};

const noopHistoryWrite = async () => {
  await Promise.resolve();
};

const createHistoryAdapter = (
  mastra: MastraClient,
  agentId: string,
  getRemoteId: () => string | undefined
): ThreadHistoryAdapter => {
  const formattedHistory = {
    append: noopHistoryWrite,
    load: async () => {
      const remoteId = getRemoteId();
      if (remoteId === undefined) {
        return { messages: [] };
      }
      const { messages } = await mastra.listThreadMessages(remoteId, {
        agentId,
      });
      const uiMessages = toAISdkMessages(messages, { version: "v7" });
      return {
        messages: uiMessages.map((message, index) => ({
          message,
          parentId: index === 0 ? null : (uiMessages[index - 1]?.id ?? null),
        })),
      };
    },
  };

  // SAFETY: the generic adapter contract cannot express that this integration always loads Mastra AI SDK v7 UIMessage values.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    append: noopHistoryWrite,
    load: async () => await Promise.resolve({ messages: [] }),
    withFormat: () => formattedHistory,
  } as ThreadHistoryAdapter;
};

export const messageIdsAfter = (
  messages: readonly { id: string }[],
  lastRetainedId?: string
): string[] => {
  const lastRetainedIndex =
    lastRetainedId === undefined
      ? -1
      : messages.findIndex(({ id }) => id === lastRetainedId);

  if (lastRetainedId !== undefined && lastRetainedIndex === -1) {
    throw new Error(`Message ${lastRetainedId} is missing from Mastra memory`);
  }

  return messages.slice(lastRetainedIndex + 1).map(({ id }) => id);
};

export const truncateMastraThread = async ({
  agentId,
  messageIds,
  threadId,
}: {
  agentId: string;
  messageIds: readonly string[];
  threadId: string;
}): Promise<void> => {
  const thread = getMastraClient().getMemoryThread({ agentId, threadId });
  const { messages } = await thread.listMessages({
    orderBy: { direction: "ASC", field: "createdAt" },
    perPage: false,
  });
  const deletedIds = messageIdsAfter(messages, messageIds.at(-1));
  if (deletedIds.length > 0) {
    await thread.deleteMessages(deletedIds);
  }
};

export const createMastraThreadListAdapter = ({
  agentId,
}: {
  agentId: string;
}): RemoteThreadListAdapter => {
  const mastra = getMastraClient();
  const memoryThread = (remoteId: string) =>
    mastra.getMemoryThread({ agentId, threadId: remoteId });

  const persist = async (
    remoteId: string,
    patch: { archived?: boolean; title?: string }
  ): Promise<void> => {
    const current = await memoryThread(remoteId).get();
    const next = archiveThreadUpdate(
      current,
      patch.archived ?? isArchivedMetadata(current.metadata),
      patch.title
    );
    await memoryThread(remoteId).update({
      agentId,
      metadata: next.metadata,
      resourceId: next.resourceId,
      title: next.title,
    });
  };

  const useAdapters = (): RuntimeAdapters => {
    const aui = useAui();
    return useMemo(
      () => ({
        history: createHistoryAdapter(
          mastra,
          agentId,
          () => aui.threadListItem.getState().remoteId
        ),
      }),
      [aui]
    );
  };

  return {
    archive: async (remoteId) => {
      await persist(remoteId, { archived: true });
    },
    delete: async (remoteId) => {
      await memoryThread(remoteId).delete();
    },
    fetch: async (threadId) =>
      toRemoteThreadMetadata(await memoryThread(threadId).get()),
    generateTitle: async (remoteId, messages) => {
      const title = titleFromMessages(messages);
      if (title !== undefined) {
        await persist(remoteId, { title });
      }
      return createAssistantStream((controller) => {
        if (title !== undefined) {
          controller.appendText(title);
        }
      });
    },
    initialize: async (localId) => {
      const created = await mastra.createMemoryThread({
        agentId,
        metadata: { archived: false },
        resourceId: getChatResourceId(),
        threadId: localId,
      });
      return { remoteId: created.id };
    },
    list: async (params) => {
      const page =
        params?.after === undefined ? 0 : Math.trunc(Number(params.after));
      const response = await mastra.listMemoryThreads({
        agentId,
        orderBy: { direction: "DESC", field: "updatedAt" },
        page: Number.isNaN(page) ? 0 : page,
        perPage: 50,
        resourceId: getChatResourceId(),
      });
      return {
        nextCursor: response.hasMore
          ? String((Number.isNaN(page) ? 0 : page) + 1)
          : undefined,
        threads: response.threads.map(toRemoteThreadMetadata),
      };
    },
    rename: async (remoteId, title) => {
      await persist(remoteId, { title });
    },
    unarchive: async (remoteId) => {
      await persist(remoteId, { archived: false });
    },
    unstable_useAdapters: useAdapters,
  };
};

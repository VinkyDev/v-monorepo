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

const RESEARCH_AGENT_ID = "research-agent";
export const RESEARCH_OWNER_STORAGE_KEY = "research-agent-owner";

export interface OwnerStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface ThreadArchiveFields {
  archived?: boolean;
}

type ListedThread = Awaited<
  ReturnType<RemoteThreadListAdapter["list"]>
>["threads"][number];

type MemoryThread = Awaited<
  ReturnType<ReturnType<MastraClient["getMemoryThread"]>["get"]>
>;

const fallbackOwnerStorage = new Map<string, string>();

export const browserOwnerStorage = (): OwnerStorage => {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem: (key) => fallbackOwnerStorage.get(key) ?? null,
      setItem: (key, value) => {
        fallbackOwnerStorage.set(key, value);
      },
    };
  }
};

export const loadOwnerId = (storage: OwnerStorage): string => {
  const existing = storage.getItem(RESEARCH_OWNER_STORAGE_KEY);
  if (existing !== null && existing.length > 0) {
    return existing;
  }
  const id = crypto.randomUUID();
  storage.setItem(RESEARCH_OWNER_STORAGE_KEY, id);
  return id;
};

export const createMastraClient = (
  baseUrl = globalThis.location.origin
): MastraClient => new MastraClient({ baseUrl });

export const isArchivedMetadata = (metadata?: ThreadArchiveFields): boolean =>
  metadata?.archived === true;

export const withArchivedMetadata = (
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

export const toRemoteThreadMetadata = (thread: {
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

export const archiveThreadUpdate = (
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

export const titleFromMessages = (
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
  client: MastraClient,
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
      const { messages } = await client.listThreadMessages(remoteId, {
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

  // SAFETY: useChatRuntime supplies AI SDK UIMessage as TMessage, and
  // toAISdkMessages({ version: "v7" }) returns the same wire type.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- ThreadHistoryAdapter cannot encode that fixed format relationship.
  return {
    append: noopHistoryWrite,
    load: async () => await Promise.resolve({ messages: [] }),
    withFormat: () => formattedHistory,
  } as ThreadHistoryAdapter;
};

export const createMastraThreadAdapter = ({
  agentId = RESEARCH_AGENT_ID,
  client,
  ownerId,
}: {
  agentId?: string;
  client: MastraClient;
  ownerId: string;
}): RemoteThreadListAdapter => {
  const memoryThread = (remoteId: string) =>
    client.getMemoryThread({ agentId, threadId: remoteId });

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
          client,
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
      const created = await client.createMemoryThread({
        agentId,
        metadata: { archived: false },
        resourceId: ownerId,
        threadId: localId,
      });
      return { remoteId: created.id };
    },
    list: async (params) => {
      const page =
        params?.after === undefined ? 0 : Math.trunc(Number(params.after));
      const response = await client.listMemoryThreads({
        agentId,
        orderBy: { direction: "DESC", field: "updatedAt" },
        page: Number.isNaN(page) ? 0 : page,
        perPage: 50,
        resourceId: ownerId,
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

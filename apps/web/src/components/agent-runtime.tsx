import { HttpAgent } from "@ag-ui/client";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  ExportedMessageRepository,
  Suggestions,
  useAuiEvent,
  useAuiState,
} from "@assistant-ui/react";
import type { ThreadHistoryAdapter, ThreadMessage } from "@assistant-ui/react";
import { useAgUiRuntime } from "@assistant-ui/react-ag-ui";
import type { UseAgUiThreadListAdapter } from "@assistant-ui/react-ag-ui";
import { toast } from "@v-monorepo/ui/components/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { env } from "#/env.ts";
import { researchAttachments } from "#/lib/research-attachments.ts";
import {
  deleteRemoteThread,
  listRemoteThreads,
  patchRemoteThread,
  RESOURCE_ID_HEADER,
} from "#/lib/research-memory.ts";
import {
  appendThreadMessage,
  applyRemoteThreads,
  archiveThread,
  deleteThread,
  loadOwnerId,
  loadThreadState,
  messagesForThread,
  renameThread,
  saveThreadState,
  switchToNewThread,
  switchToThread,
  unarchiveThread,
} from "#/lib/research-threads.ts";
import type {
  RemoteThread,
  ResearchThreadState,
  ThreadStorage,
} from "#/lib/research-threads.ts";

const auiConfig = AuiConfig({
  suggestions: Suggestions([
    {
      label: "查公开资料并引用",
      prompt:
        "用维基百科和公开网页解释 AG-UI 协议是什么，并给出每一条结论的来源。",
      title: "AG-UI 是什么",
    },
    {
      label: "Wikipedia + 原文页",
      prompt:
        "Research Mastra 怎么把 Agent 接到前端。先查百科或文档，再抓关键页面，写成带出处的简报。",
      title: "Mastra 怎么接 UI",
    },
    {
      label: "live sources only",
      prompt:
        "Write a short cited brief on assistant-ui. Prefer Wikipedia, then fetch the official docs page.",
      title: "assistant-ui 简报",
    },
  ]),
});

const browserStorage = (): ThreadStorage => {
  try {
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    };
  }
};

const hydrateMessages = (
  state: ResearchThreadState,
  threadId: string
): readonly ThreadMessage[] =>
  ExportedMessageRepository.fromArray(
    messagesForThread(state, threadId)
  ).messages.map((item) => item.message);

const threadCustom = (lastMessageAt: string | undefined) =>
  lastMessageAt === undefined ? undefined : { lastMessageAt };

const toastRemoteError = (title: string) => {
  toast.add({
    priority: "high",
    title,
    type: "error",
  });
};

const syncRemoteThreads = async (
  ownerId: string,
  onRemote: (threads: readonly RemoteThread[]) => void
): Promise<void> => {
  try {
    onRemote(await listRemoteThreads(ownerId));
  } catch {
    // Keep local transcripts when Mastra is unreachable.
  }
};

const tryRemote = async (task: Promise<void>, title: string): Promise<void> => {
  try {
    await task;
  } catch {
    toastRemoteError(title);
  }
};

const AttachmentErrorToast = () => {
  useAuiEvent("composer.attachmentAddError", ({ message, reason }) => {
    if (reason === "not-accepted") {
      toastRemoteError("不支持该文件类型");
      return;
    }
    if (reason === "no-adapter") {
      toastRemoteError("当前对话未开启附件");
      return;
    }
    toastRemoteError(
      message !== undefined && message.length > 0 ? message : "附件上传失败"
    );
  });
  return null;
};

const SyncRemoteThreads = ({
  onIdle,
  onRemote,
  ownerId,
}: {
  onIdle: () => void;
  onRemote: (threads: readonly RemoteThread[]) => void;
  ownerId: string;
}) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const wasRunning = useRef(false);

  useEffect(() => {
    if (wasRunning.current && !isRunning) {
      onIdle();
      void syncRemoteThreads(ownerId, onRemote);
    }
    wasRunning.current = isRunning;
  }, [isRunning, onIdle, onRemote, ownerId]);

  return null;
};

export const AgentRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const storage = useMemo(() => browserStorage(), []);
  const ownerId = useMemo(() => loadOwnerId(storage), [storage]);
  const [state, setState] = useState<ResearchThreadState>(() =>
    loadThreadState(storage)
  );
  const stateRef = useRef(state);

  const persist = useCallback(
    (next: ResearchThreadState, reveal = true) => {
      stateRef.current = next;
      saveThreadState(storage, next);
      if (reveal) {
        setState(next);
      }
    },
    [storage]
  );

  const applyRemote = useCallback(
    (remote: readonly RemoteThread[]) => {
      persist(applyRemoteThreads(stateRef.current, remote));
    },
    [persist]
  );

  const revealPersisted = useCallback(() => {
    persist(stateRef.current);
  }, [persist]);

  useEffect(() => {
    void syncRemoteThreads(ownerId, applyRemote);
  }, [applyRemote, ownerId]);

  const agent = useMemo(
    () =>
      new HttpAgent({
        headers: { [RESOURCE_ID_HEADER]: ownerId },
        threadId: state.threadId,
        url: env.VITE_AGUI_URL,
      }),
    [ownerId, state.threadId]
  );

  const threadList = useMemo((): UseAgUiThreadListAdapter => {
    const regular = state.threads.filter((thread) => !thread.archived);
    const archived = state.threads.filter((thread) => thread.archived);

    /* oxlint-disable typescript/no-deprecated -- AG-UI threadList adapter still uses threadId / onSwitchToNewThread. */
    return {
      archivedThreads: archived.map((thread) => ({
        custom: threadCustom(thread.lastMessageAt),
        id: thread.id,
        status: "archived",
        title: thread.title,
      })),
      onArchive: (threadId) => {
        persist(archiveThread(stateRef.current, threadId));
        void tryRemote(
          patchRemoteThread(ownerId, threadId, { archived: true }),
          "未能归档服务端对话"
        );
      },
      onDelete: (threadId) => {
        persist(deleteThread(stateRef.current, threadId));
        void tryRemote(
          deleteRemoteThread(ownerId, threadId),
          "未能删除服务端对话"
        );
      },
      onRename: (threadId, title) => {
        persist(renameThread(stateRef.current, threadId, title));
        void tryRemote(
          patchRemoteThread(ownerId, threadId, { title }),
          "未能重命名服务端对话"
        );
      },
      onSwitchToNewThread: () => {
        persist(switchToNewThread(stateRef.current));
      },
      onSwitchToThread: (threadId) => {
        const next = switchToThread(stateRef.current, threadId);
        persist(next);
        return { messages: hydrateMessages(next, threadId) };
      },
      onUnarchive: (threadId) => {
        persist(unarchiveThread(stateRef.current, threadId));
        void tryRemote(
          patchRemoteThread(ownerId, threadId, { archived: false }),
          "未能恢复服务端对话"
        );
      },
      threadId: state.threadId,
      threads: regular.map((thread) => ({
        custom: threadCustom(thread.lastMessageAt),
        id: thread.id,
        status: "regular",
        title: thread.title,
      })),
    };
    /* oxlint-enable typescript/no-deprecated */
  }, [ownerId, persist, state.threadId, state.threads]);

  const history = useMemo(
    (): ThreadHistoryAdapter =>
      /* oxlint-disable eslint/require-await -- ThreadHistoryAdapter methods are Promise-typed. */
      ({
        append: async ({ message }: { message: ThreadMessage }) => {
          const next = appendThreadMessage(
            stateRef.current,
            stateRef.current.threadId,
            message
          );
          if (next !== stateRef.current) {
            persist(next, false);
          }
        },
        load: async () =>
          ExportedMessageRepository.fromArray(
            messagesForThread(stateRef.current, stateRef.current.threadId)
          ),
      }),
    /* oxlint-enable eslint/require-await */
    [persist]
  );

  const runtime = useAgUiRuntime({
    adapters: { attachments: researchAttachments, history, threadList },
    agent,
    onError: (error) => {
      toast.add({
        description: import.meta.env.DEV ? error.message : undefined,
        priority: "high",
        title: "Research 暂时无法回答",
        type: "error",
      });
    },
  });

  return (
    <AssistantRuntimeProvider config={auiConfig} runtime={runtime}>
      <AttachmentErrorToast />
      <SyncRemoteThreads
        onIdle={revealPersisted}
        onRemote={applyRemote}
        ownerId={ownerId}
      />
      {children}
    </AssistantRuntimeProvider>
  );
};

import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/ai-sdk";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  Suggestions,
  useAuiEvent,
  useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import { toast } from "@v-monorepo/ui/components/toast";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { env } from "#/env.ts";
import {
  browserOwnerStorage,
  createMastraClient,
  createMastraThreadAdapter,
  loadOwnerId,
} from "#/lib/mastra-threads.ts";

const auiConfig = AuiConfig({
  suggestions: Suggestions([
    {
      label: "查公开资料并引用",
      prompt:
        "用维基百科和公开网页解释 Mastra Memory 是什么，并给出每一条结论的来源。",
      title: "Mastra Memory 是什么",
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

const attachments = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
]);

const toastChatError = (error: Error) => {
  toast.add({
    description: import.meta.env.DEV ? error.message : undefined,
    priority: "high",
    title: "Research 暂时无法回答",
    type: "error",
  });
};

const toastAttachmentError = (title: string) => {
  toast.add({
    priority: "high",
    title,
    type: "error",
  });
};

const useResearchChatRuntime = () => {
  const ownerId = useMemo(() => loadOwnerId(browserOwnerStorage()), []);
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: env.VITE_CHAT_URL,
        prepareSendMessagesRequest: (options) => ({
          body: {
            ...options.body,
            id: options.id,
            memory: {
              resource: ownerId,
              thread: options.id,
            },
            messageId: options.messageId,
            messages: options.messages,
            metadata: options.requestMetadata,
            trigger: options.trigger,
          },
        }),
      }),
    [ownerId]
  );

  return useChatRuntime({
    adapters: { attachments },
    onError: toastChatError,
    transport,
  });
};

const AttachmentErrorToast = () => {
  useAuiEvent("composer.attachmentAddError", ({ message, reason }) => {
    if (reason === "not-accepted") {
      toastAttachmentError("不支持该文件类型");
      return;
    }
    if (reason === "no-adapter") {
      toastAttachmentError("当前对话未开启附件");
      return;
    }
    toastAttachmentError(
      message !== undefined && message.length > 0 ? message : "附件上传失败"
    );
  });
  return null;
};

export const AgentRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const ownerId = useMemo(() => loadOwnerId(browserOwnerStorage()), []);
  const client = useMemo(() => createMastraClient(), []);
  const adapter = useMemo(
    () => createMastraThreadAdapter({ client, ownerId }),
    [client, ownerId]
  );
  const runtime = useRemoteThreadListRuntime({
    adapter,
    // oxlint-disable-next-line react/hooks -- assistant-ui executes runtimeHook as a hook for each thread.
    runtimeHook: useResearchChatRuntime,
  });

  return (
    <AssistantRuntimeProvider config={auiConfig} runtime={runtime}>
      <AttachmentErrorToast />
      {children}
    </AssistantRuntimeProvider>
  );
};

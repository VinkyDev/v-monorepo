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
  createMastraThreadListAdapter,
  getChatResourceId,
  truncateMastraThread,
} from "./mastra.ts";

const config = AuiConfig({
  suggestions: Suggestions([
    {
      label: "了解助手能力",
      prompt: "请简要介绍你能帮助我完成哪些任务。",
      title: "你能做什么？",
    },
    {
      label: "分析一个问题",
      prompt: "请帮我分析一个问题，并说明你的推理依据。",
      title: "帮我分析问题",
    },
    {
      label: "总结附件",
      prompt: "请总结我接下来上传的图片或文本文件。",
      title: "总结附件内容",
    },
  ]),
});

const attachments = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
]);

const showChatError = (error: Error) => {
  toast.add({
    description: import.meta.env.DEV ? error.message : undefined,
    priority: "high",
    title: "助手暂时无法回答",
    type: "error",
  });
};

const showAttachmentError = (title: string) => {
  toast.add({ priority: "high", title, type: "error" });
};

const useChatThreadRuntime = () => {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: `/chat/${encodeURIComponent(env.VITE_AGENT_ID)}`,
        prepareSendMessagesRequest: async (options) => {
          if (options.trigger === "regenerate-message") {
            // Mastra persists route output, so remove the stale suffix before replaying.
            await truncateMastraThread({
              agentId: env.VITE_AGENT_ID,
              messageIds: options.messages.map(({ id }) => id),
              threadId: options.id,
            });
          }

          return {
            body: {
              ...options.body,
              id: options.id,
              memory: {
                resource: getChatResourceId(),
                thread: options.id,
              },
              messageId: options.messageId,
              messages: options.messages,
              metadata: options.requestMetadata,
              trigger: options.trigger,
            },
          };
        },
      }),
    []
  );

  return useChatRuntime({
    adapters: { attachments },
    onError: showChatError,
    transport,
  });
};

const AttachmentErrorToast = () => {
  useAuiEvent("composer.attachmentAddError", ({ message, reason }) => {
    if (reason === "not-accepted") {
      showAttachmentError("不支持该文件类型");
    } else if (reason === "no-adapter") {
      showAttachmentError("当前对话未开启附件");
    } else {
      showAttachmentError(message?.trim() || "附件上传失败");
    }
  });
  return null;
};

export const ChatRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const adapter = useMemo(
    () => createMastraThreadListAdapter({ agentId: env.VITE_AGENT_ID }),
    []
  );
  const runtime = useRemoteThreadListRuntime({
    adapter,
    // oxlint-disable-next-line react/hooks -- assistant-ui invokes this hook for each thread runtime.
    runtimeHook: useChatThreadRuntime,
  });

  return (
    <AssistantRuntimeProvider config={config} runtime={runtime}>
      <AttachmentErrorToast />
      {children}
    </AssistantRuntimeProvider>
  );
};

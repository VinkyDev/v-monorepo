import { HttpAgent } from "@ag-ui/client";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  Suggestions,
} from "@assistant-ui/react";
import { useAgUiRuntime } from "@assistant-ui/react-ag-ui";
import { Button } from "@v-monorepo/ui/components/button";
import { toast } from "@v-monorepo/ui/components/toast";
import { SquarePenIcon } from "lucide-react";
import { createContext, use, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { env } from "#/env.ts";

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

const AgentThreadContext = createContext<(() => void) | null>(null);

const useResetAgentThread = (): (() => void) => {
  const resetThread = use(AgentThreadContext);
  if (resetThread === null) {
    throw new Error("useResetAgentThread requires AgentRuntimeProvider");
  }
  return resetThread;
};

export const NewThreadButton = () => {
  const resetThread = useResetAgentThread();
  return (
    <Button
      onClick={resetThread}
      size="icon-sm"
      variant="ghost"
      aria-label="新对话"
    >
      <SquarePenIcon />
    </Button>
  );
};

const AgentRuntime = ({
  children,
  threadId,
}: {
  children: ReactNode;
  threadId: string;
}) => {
  const agent = useMemo(
    () =>
      new HttpAgent({
        threadId,
        url: env.VITE_AGUI_URL,
      }),
    [threadId]
  );
  const runtime = useAgUiRuntime({
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
      {children}
    </AssistantRuntimeProvider>
  );
};

export const AgentRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const resetThread = useMemo(
    () => () => {
      setThreadId(crypto.randomUUID());
    },
    []
  );

  return (
    <AgentThreadContext value={resetThread}>
      <AgentRuntime key={threadId} threadId={threadId}>
        {children}
      </AgentRuntime>
    </AgentThreadContext>
  );
};

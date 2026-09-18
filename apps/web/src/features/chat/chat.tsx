import { AppBoundary } from "#/components/app-boundary.tsx";
import { ThreadList } from "#/components/assistant-ui/elements/thread-list.aui.tsx";
import type { ThreadComponents } from "#/components/assistant-ui/elements/thread.aui.tsx";
import { Thread } from "#/components/assistant-ui/elements/thread.aui.tsx";

import { ChatRuntimeProvider } from "./runtime.tsx";

const threadComponents: ThreadComponents = {
  Welcome: () => (
    <div className="mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="fade-in slide-in-from-bottom-1 animate-in text-2xl font-medium tracking-tight duration-200">
        今天有什么可以帮你？
      </h1>
    </div>
  ),
};

export const Chat = () => (
  <ChatRuntimeProvider>
    <main className="bg-background text-foreground flex h-dvh">
      <aside className="flex h-full w-64 shrink-0 flex-col border-e p-2">
        <p className="text-muted-foreground px-2.5 py-2 text-sm tracking-tight">
          Assistant
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThreadList />
        </div>
      </aside>
      <AppBoundary name="chat">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Thread components={threadComponents} />
        </div>
      </AppBoundary>
    </main>
  </ChatRuntimeProvider>
);

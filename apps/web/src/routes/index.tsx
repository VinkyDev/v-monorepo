import { createFileRoute } from "@tanstack/react-router";

import { AgentRuntimeProvider } from "#/components/agent-runtime.tsx";
import { AgentThread } from "#/components/agent-thread.tsx";
import { AppBoundary } from "#/components/app-boundary.tsx";
import { ThreadList } from "#/components/assistant-ui/elements/thread-list.aui.tsx";

const Home = () => (
  <AgentRuntimeProvider>
    <main className="bg-background text-foreground flex h-dvh">
      <aside className="flex h-full w-64 shrink-0 flex-col border-e p-2">
        <p className="text-muted-foreground px-2.5 py-2 text-sm tracking-tight">
          Research
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThreadList />
        </div>
      </aside>
      <AppBoundary name="research-agent">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AgentThread />
        </div>
      </AppBoundary>
    </main>
  </AgentRuntimeProvider>
);

export const Route = createFileRoute("/")({
  component: Home,
});

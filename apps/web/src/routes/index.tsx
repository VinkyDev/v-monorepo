import { createFileRoute } from "@tanstack/react-router";

import {
  AgentRuntimeProvider,
  NewThreadButton,
} from "#/components/agent-runtime.tsx";
import { AgentThread } from "#/components/agent-thread.tsx";
import { AppBoundary } from "#/components/app-boundary.tsx";

const Home = () => (
  <AgentRuntimeProvider>
    <main className="bg-background text-foreground flex h-svh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-muted-foreground text-sm tracking-tight">Research</p>
        <NewThreadButton />
      </header>
      <AppBoundary name="research-agent">
        <div className="flex min-h-0 flex-1 flex-col">
          <AgentThread />
        </div>
      </AppBoundary>
    </main>
  </AgentRuntimeProvider>
);

export const Route = createFileRoute("/")({
  component: Home,
});

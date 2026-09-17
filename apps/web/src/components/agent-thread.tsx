import type { ThreadComponents } from "#/components/assistant-ui/elements/thread.aui.tsx";
import { Thread } from "#/components/assistant-ui/elements/thread.aui.tsx";

const THREAD_COMPONENTS: ThreadComponents = {
  Welcome: () => (
    <div className="mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="fade-in slide-in-from-bottom-1 animate-in text-2xl font-medium tracking-tight duration-200">
        今天想查什么？
      </h1>
    </div>
  ),
};

export const AgentThread = () => <Thread components={THREAD_COMPONENTS} />;

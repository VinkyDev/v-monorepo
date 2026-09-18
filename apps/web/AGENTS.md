# `@v-monorepo/web`

React app. The home screen is a Research chat: assistant-ui `useChatRuntime` over Mastra `chatRoute`, proxied to `@v-monorepo/agents` at `/chat/research-agent`. Sessions live in Mastra Memory at `/api/memory/threads`.

- `src/components/agent-runtime.tsx` — `useRemoteThreadListRuntime` + `useChatRuntime` (`AssistantChatTransport`) + attachments
- `src/components/agent-thread.tsx` — 官方 `@assistant-ui/thread`（`src/components/assistant-ui`）
- `src/lib/mastra-threads.ts` — `MastraClient` `RemoteThreadListAdapter`；`ownerId` 只存在 localStorage
- `src/components/assistant-ui/` — shadcn registry 安装的 Thread / ThreadList / ToolFallback / ToolGroup / Reasoning / Markdown
- `src/lib/api.ts` — `createApiClient` singleton (Hono RPC, for pages that call `apps/server`)
- `src/lib/query-client.ts` — retry, `throwOnError`, and the global error handlers
- `src/lib/api-error-effects.ts` — codes the app answers centrally; a hit means the call site stays quiet
- `src/lib/error-view.ts` — the only place an unknown throw turns into user-facing copy

Error routing: a first load with no data throws to the route error boundary (`ErrorScreen`); a background refresh keeps the stale data and toasts. Mutations toast unless they set `meta: { showErrorToast: false }` and render the failure themselves.

4xx are never reported; 5xx and network failures go to `logger`. Wrap a widget that may fail on its own in `<AppBoundary name="…">`.

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router.

Run `pnpm dev:agents` alongside `pnpm dev:web`. Vite proxies `/chat` and `/api/memory` to agents; remaining `/api` goes to `apps/server`.

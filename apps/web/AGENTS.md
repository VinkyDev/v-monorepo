# `@v-monorepo/web`

React app. The home screen is a configurable assistant-ui chat over Mastra `chatRoute`. `VITE_AGENT_ID` selects the agent (the included demo uses `assistant`). Sessions live in Mastra Memory at `/api/memory/threads`.

- `src/features/chat/` — chat 页面组合、runtime 和 Mastra adapter
- `src/components/assistant-ui/` — shadcn registry 安装的 Thread / ThreadList / ToolFallback / ToolGroup / Reasoning / Markdown
- `src/lib/api.ts` — `createApiClient` singleton (Hono RPC, for pages that call `apps/server`)
- `src/lib/query-client.ts` — retry, `throwOnError`, and the global error handlers
- `src/lib/api-error-effects.ts` — codes the app answers centrally; a hit means the call site stays quiet
- `src/lib/error-view.ts` — the only place an unknown throw turns into user-facing copy

Error routing: a first load with no data throws to the route error boundary (`ErrorScreen`); a background refresh keeps the stale data and toasts. Mutations toast unless they set `meta: { showErrorToast: false }` and render the failure themselves.

4xx are never reported; 5xx and network failures go to `logger`. Wrap a widget that may fail on its own in `<AppBoundary name="…">`.

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router.

Run `pnpm dev:agents` alongside `pnpm dev:web`. Vite proxies `/chat` and `/api/memory` to agents; remaining `/api` goes to `apps/server`.

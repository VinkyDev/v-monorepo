# `@v-monorepo/web`

React app. The home screen is a Research chat: assistant-ui over the AG-UI protocol, proxied to `@v-monorepo/agents` at `/agui/research-agent`.

- `src/components/agent-runtime.tsx` — `HttpAgent` + `useAgUiRuntime` + Mastra-backed thread list + attachments
- `src/components/agent-thread.tsx` — 官方 `@assistant-ui/thread`（`src/components/assistant-ui`）
- `src/lib/research-threads.ts` — 对话列表的本地状态（AG-UI transcript）
- `src/lib/research-memory.ts` — Mastra Memory 的 list / rename / archive / delete
- `src/lib/research-attachments.ts` — assistant-ui `AttachmentAdapter`（图片走 image，文本/PDF 走 document，刷新后仍是附件）
- `src/components/assistant-ui/` — shadcn registry 安装的 Thread / ThreadList / ToolFallback / ToolGroup / Reasoning / Markdown
- `src/lib/api.ts` — `createApiClient` singleton (Hono RPC, for pages that call `apps/server`)
- `src/lib/query-client.ts` — retry, `throwOnError`, and the global error handlers
- `src/lib/api-error-effects.ts` — codes the app answers centrally; a hit means the call site stays quiet
- `src/lib/error-view.ts` — the only place an unknown throw turns into user-facing copy

Error routing: a first load with no data throws to the route error boundary (`ErrorScreen`); a background refresh keeps the stale data and toasts. Mutations toast unless they set `meta: { showErrorToast: false }` and render the failure themselves.

4xx are never reported; 5xx and network failures go to `logger`. Wrap a widget that may fail on its own in `<AppBoundary name="…">`.

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router.

Run `pnpm dev:agents` alongside `pnpm dev:web`.

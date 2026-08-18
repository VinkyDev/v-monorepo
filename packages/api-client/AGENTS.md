# `@v-monorepo/api-client`

Typed Hono RPC client. Types come from `AppType` on `@v-monorepo/server/app`.

Use `createBrowserApiClient()` in the web app (same-origin `/api`). Use `createApiClient(baseUrl)` elsewhere. Every request gets `x-request-id`. Failed requests become `AppError` inside the client fetch.

Pages call `await api.health.$get()` from React Query. The web `createQueryClient()` toasts after retries are exhausted. Branch on `error.code === "NOT_FOUND"` only when a call site needs special handling beyond the toast. Shared payloads and error codes live in `@v-monorepo/shared`. New server routes: export them on `AppType` from `@v-monorepo/server/app`; the client picks them up.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc) when adding or calling routes.

# `@v-monorepo/api-client`

Hono RPC transport. `createApiClient(baseUrl)` returns `hc<AppType>`; types come from `@v-monorepo/server/api`. New server routes on `AppType` show up as `client.<path>.$method()`.

Web: `createApiClient(env.VITE_API_BASE_URL)` (same-origin `/api`). Failed requests throw `AppError`. The custom `fetch` injects `x-request-id`.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

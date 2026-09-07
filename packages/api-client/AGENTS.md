# `@v-monorepo/api-client`

Hono RPC transport. `createApiClient(baseUrl)` returns `hc<AppType>`; types come from `@v-monorepo/server/api`. New server routes on `AppType` show up as `client.<path>.$method()`. Parse bodies with `response.json()`.

Web: `createApiClient(env.VITE_API_BASE_URL)` (same-origin `/api`). Failed requests throw `AppError`.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

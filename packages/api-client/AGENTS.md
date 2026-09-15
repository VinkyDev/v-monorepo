# `@v-monorepo/api-client`

Hono RPC transport. `createApiClient(baseUrl)` returns `hc<AppType>`; types come from `@v-monorepo/server/api`. New server routes on `AppType` show up as `client.<path>.$method()`. Parse bodies with `response.json()`.

Web: `createApiClient(env.VITE_API_BASE_URL)` (same-origin `/api`).

The fetch wrapper is the only thing this package adds:

- non-2xx rebuilds the server's `ApiError`, with `traceId` from `X-Request-Id`
- a cancelled request rethrows the original `AbortError` — cancellation is not a failure
- a timeout maps to `timeout`, an unreachable server to `unavailable` (503, retryable)
- `error.request` carries `{ method, path, status }` only; query strings can hold tokens

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

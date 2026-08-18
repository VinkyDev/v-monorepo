# `@v-monorepo/api-client`

Typed Hono RPC client. Types come from `AppType` on `@v-monorepo/server/app`.

Use `createBrowserApiClient()` in the web app (same-origin `/api`). Use `createApiClient(baseUrl)` elsewhere. Failed requests throw `AppError`.

New server routes: export them on `AppType`; the client picks them up.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

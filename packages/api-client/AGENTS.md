# `@v-monorepo/api-client`

Typed Hono RPC client. Types come from `AppType` on `@v-monorepo/server/app`.

Use `createApiClient(env.VITE_API_BASE_URL)` in the web app (same-origin `/api` proxy), `createApiClient(baseUrl)` elsewhere. Failed requests throw `AppError`; error and request-id helpers come from `@v-monorepo/shared`.

New server routes: export them on `AppType`; the client picks them up.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

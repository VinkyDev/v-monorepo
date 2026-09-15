# `@v-monorepo/api-client`

Hono RPC transport. `createApiClient(baseUrl)` returns `hc<AppType>`; types come from `@v-monorepo/server/api`. New server routes on `AppType` show up as `client.<path>.$method()`. Parse bodies with `response.json()`.

Web and desktop both pass a relative `/api`, so nothing here may assume an absolute URL.

The fetch wrapper is the only thing this package adds:

- non-2xx rebuilds the server's `ApiError`, with `traceId` from `X-Request-Id`
- every request carries an `X-Request-Id` the server adopts, so one id spans both logs — and a failure that never got a response still has one
- a cancelled request rethrows the original `AbortError` — cancellation is not a failure
- `timeoutMs` (default 15s) only catches a server that never answers; a reachable one returns its own 504 first
- an unreachable server maps to `unavailable` (503, retryable)
- `error.request` carries `{ method, path, status }` only; query strings can hold tokens

`headers` takes Hono's own type, so a function form can mint a fresh auth token per request.

Success bodies are typed from `AppType` but never validated at runtime; only errors are parsed with Zod. That holds because web and server ship together. **Give desktop its own release train and this stops being true** — a shipped renderer will outlive the server it talks to, and success payloads then need a schema here.

**RPC** — [Hono RPC](https://hono.dev/docs/guides/rpc)

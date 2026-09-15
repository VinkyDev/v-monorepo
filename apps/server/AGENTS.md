# `@v-monorepo/server`

Hono API. Routes live in `src/routes/<domain>.ts` and are mounted on `src/api.ts`, whose `AppType` drives the RPC client. Cross-cutting machinery lives in `src/lib/`, the same split the web app uses. Inside `src`, import through the `#/` alias.

- `src/app.ts` — `createApp()`, the whole middleware stack as one expression, and the package's `.` export. Free of side effects, so importing it starts nothing. `requestId()` runs first, so `X-Request-Id` is on every response and in every error log.
- `src/dev.ts` / `src/node.ts` — the Vite dev entry and the Node entry. Each composes its own sinks with `addSink(consoleSink)`; an entry that forgets to leaves the server silent.
- `src/lib/error.ts` — `handleError` is the only place a failure becomes a response, and the only place a 5xx is logged. Throw `ApiError` from anywhere; an `HTTPException` keeps its 4xx message and loses its 5xx one.
- `src/lib/validate.ts` — `validate("json" | "query" | "param", schema)` rejects with `invalid_params` carrying dotted field paths, and documents the schema in the OpenAPI spec at the same time.
- `src/lib/openapi.ts` — the spec and Swagger UI, mounted outside `/api`. Error responses are attached to all routes through `defaultOptions`, keyed per method.
- `src/routes/demo.ts` — a tour of the error contract. Delete the file and its `api.ts` line to drop it.

Tests cover the demo codes, the 5xx logging path, and the OpenAPI document.

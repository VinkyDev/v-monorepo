# `@v-monorepo/server`

Hono API. Routes live in `src/routes/<domain>/index.ts` and are mounted on `src/api.ts`, whose `AppType` drives the RPC client.

- `src/error.ts` — `handleError` is the only place a failure becomes a response, and the only place a 5xx is logged. Throw `ApiError` from anywhere; an `HTTPException` keeps its 4xx message and loses its 5xx one.
- `src/validate.ts` — `validate("json" | "query" | "param", schema)` rejects with `invalid_params` carrying dotted field paths, and documents the schema in the OpenAPI spec at the same time.
- `src/app.ts` — `requestId()` runs first, so `X-Request-Id` is on every response and in every error log. Error responses are attached to all routes through `defaultOptions`, keyed per method.
- `src/routes/demo/` — a tour of the error contract. Delete the folder and its `api.ts` line to drop it.

Tests cover the demo codes, the 5xx logging path, and the OpenAPI document.

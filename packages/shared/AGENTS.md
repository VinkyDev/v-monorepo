# `@v-monorepo/shared`

Cross-package contracts: Zod schemas and the error catalog. Put a type here when two or more packages import it.

**Payloads** — add a Zod schema and inferred type; use them in the Hono route and OpenAPI.

**Errors** — the wire body is `{ code, message, data? }` plus the right HTTP status. `code` is the only thing callers branch on.

1. Add `{ status, message }` to `businessErrors` in `src/error-catalog.ts`.
2. For a structured payload, add a Zod schema to `errorDataSchemas` under the same key — `ErrorData<Code>` and the runtime validation in `ApiError.fromBody` both derive from it.
3. Throw `new ApiError("your_code", { data })`; the client restores it via `ApiError.fromResponse`.

`isApiError(value)` uses a `Symbol.for` brand, so it holds across the separate bundles web, Electron main and preload each produce. Pass a code (`isApiError(value, "email_taken")`) to narrow `data` too.

`codeForStatus` only maps the protocol codes, whose statuses are unique — a round-trip test over `protocolCodes` enforces that, since a duplicate would silently strand whichever code lost. Business codes reuse statuses (`email_taken` is 409) and never participate; they are read from the body's `code`, never guessed from a status.

`ApiError.fromBody(body, fallback)` takes the fallback code explicitly, because "what an unrecognized code degrades to" is the transport's call: `fromResponse` derives it from the HTTP status, and the Electron accessor has no status so it passes `internal`.

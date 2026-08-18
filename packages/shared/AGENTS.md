# `@v-monorepo/shared`

Contracts both sides import: Zod schemas, HTTP helpers, `AppError`. A type belongs here only when server and client both use it.

Payloads: add a Zod schema and inferred type, then use them in the Hono route and the web caller.

Errors: add domain codes to `businessErrors` in `src/error-catalog.ts`. Throw `new AppError("CODE")` (optional `{ message }`). Reconstruct with `AppError.fromResponse`. `AppError` is the only error type on both sides.

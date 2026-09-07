# `@v-monorepo/shared`

Cross-package contracts: Zod schemas, `AppError`. Put a type here when two or more packages import it.

**Payloads** — add a Zod schema and inferred type; use them in the Hono route and OpenAPI.

**Errors** — add codes to `businessErrors` in `src/error-catalog.ts`. Throw `new AppError("CODE")` (optional `{ message }`). Reconstruct with `AppError.fromResponse`.

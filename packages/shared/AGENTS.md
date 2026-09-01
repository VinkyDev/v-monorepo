# `@v-monorepo/shared`

Cross-package contracts: Zod schemas, HTTP helpers, `AppError`. Put a type here when two or more packages import it.

**Payloads** — add a Zod schema and inferred type; use them in the Hono route and OpenAPI.

**Errors** — add codes to `businessErrors` in `src/error-catalog.ts`. Throw `new AppError("CODE")` (optional `{ message }`). Reconstruct with `AppError.fromResponse`.

**Electron** — each domain owns a file in `src/electron` (`shell.ts` today). Import `@v-monorepo/shared/electron`. Adding a domain: that file, a main `ipc/` handler, a preload module, and `xApi()` on `@v-monorepo/utils`. Renderer calls `shellApi()` (or the new accessor).

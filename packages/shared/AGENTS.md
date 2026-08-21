# `@v-monorepo/shared`

Contracts both sides import: Zod schemas, HTTP helpers, `AppError`. A type belongs here only when more than one package uses it.

Electron: each domain owns a file in `src/electron` (today `shell.ts`). Import `@v-monorepo/shared/electron`. To add a desktop domain, add that file, a main `ipc/` handler, and a preload module. Renderer code calls that domain's function on `@v-monorepo/utils` (`shellApi()` today), never `window.desktop` or a merged `desktopApi`.

Payloads: add a Zod schema and inferred type, then use them in the Hono route and the web caller.

Errors: add domain codes to `businessErrors` in `src/error-catalog.ts`. Throw `new AppError("CODE")` (optional `{ message }`). Reconstruct with `AppError.fromResponse`. `AppError` is the only error type on both sides.

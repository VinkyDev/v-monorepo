# `@v-monorepo/shared`

Contracts used by both server and client: Zod schemas, HTTP helpers, and `AppError`.

Put a type or schema here when both sides import it. UI-only and server-only code stay in their packages.

`healthStatusSchema` is the pattern for a shared payload. `REQUEST_ID_HEADER` / `createRequestId` are the request-id contract.

`errorCatalog` is the source of error codes and user-facing Chinese copy. Edit `businessErrors` in `src/error-catalog.ts` for domain codes. `title` is the short toast heading; `detail` is the default body.

Throw `new AppError("CODE")` or override with `{ message }`. Reconstruct with `AppError.fromResponse`. Convert unknown failures with `AppError.fromCause` (never leaks the cause message). Map untrusted HTTP statuses with `AppError.fromHttpStatus` (strips 5xx / timeout messages). `AppError` is the only error type on both sides.

New payloads: add a Zod schema and inferred type here, then use them in the Hono route and the web caller.

New errors: add a code to `businessErrors` in `src/error-catalog.ts`. Throw `new AppError("YOUR_CODE")` on the server (optional `{ message }` override). The API client reconstructs the same `AppError`. The web `createQueryClient()` toasts it after retries are exhausted. Branch with `error.code === "YOUR_CODE"` only when a call site needs special handling.

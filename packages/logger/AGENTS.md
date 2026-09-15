# `@v-monorepo/logger`

Isomorphic logging with a single report exit. Import `logger`, or `logger.child({ scope: "desktop" })`.

```ts
logger.error({
  event: "api_request_failed", // stable aggregation key, no dynamic values
  message: `GET /widgets -> 500`, // one line for humans
  meta: { requestId }, // structured context
  error: cause, // required on error/fatal
});
```

- Every level takes the same object payload; there is no bare-string shorthand.
- `meta` values are primitives (`LogMeta`), so any backend can index them without a serializer. Richer context belongs on `error`.
- Every record goes to the registered `LogSink[]`, which starts empty. Each entry point composes its own: `addSink(consoleSink)`, then `addSink` again for a monitoring backend. Tests are therefore silent, and `collectLogs()` from `@v-monorepo/logger/testing` installs a recording sink to assert against.
- `serializeError(cause)` flattens any thrown value into a `SerializedError`, adding `code` / `status` / `traceId` / `request` when the cause is an `ApiError`. `toError(cause)` normalizes a caught value before it reaches `logger.error`.

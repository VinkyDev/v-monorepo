# `@v-monorepo/logger`

Process logging via [tslog](https://tslog.js.org). Import `log` or `createLogger({ name: "server" })`.

- Tests: `type: "hidden"` when `VITEST` is set
- Timestamps: process timezone (`pretty.timeZone: "local"`); pin with `TZ`
- Request correlation: `await log.runInContext({ requestId }, fn)`

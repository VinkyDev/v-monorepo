# `@v-monorepo/logger`

[tslog](https://tslog.js.org) with repo defaults. Import `log` or `createLogger({ name: "server" })`.

- Tests mute console output (`type: "hidden"` when `VITEST` is set).
- Pretty timestamps follow the process timezone (`pretty.timeZone: "local"`). Pin a zone with `TZ`.
- Correlate a request with `await log.runInContext({ requestId }, fn)`.

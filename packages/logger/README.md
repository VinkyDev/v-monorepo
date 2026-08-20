# @v-monorepo/logger

基于 [tslog](https://tslog.js.org) 的共享 logger。测试环境默认静音。

```ts
import { createLogger, log } from "@v-monorepo/logger";

log.info("ready");
log.error("failed", err);

const serverLog = createLogger({ name: "server" });
await serverLog.runInContext({ requestId }, async () => {
  serverLog.info("handling request");
});
```

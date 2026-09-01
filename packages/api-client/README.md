# @v-monorepo/api-client

Hono RPC 传输工厂。用 `hc<AppType>` 镜像服务端路由，不在这里列出请求函数。失败抛 `AppError`。

```ts
import { createApiClient } from "@v-monorepo/api-client";

const api = createApiClient("/api");
const response = await api.health.$get();
const data = await response.json();
```

新路由加在服务端并导出到 `AppType` 即可。Web 的 TanStack Query 工厂放在 `apps/web/src/lib/queries`。

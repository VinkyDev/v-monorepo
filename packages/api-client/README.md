# @v-monorepo/api-client

Hono RPC 传输工厂。用 `hc<AppType>` 镜像服务端路由，不在这里列出请求函数。失败抛 `ApiError`。

```ts
import { createApiClient } from "@v-monorepo/api-client";

const api = createApiClient("/api");
const response = await api.health.$get();
const data = await response.json();
```

新路由加在服务端并导出到 `AppType` 即可。

非 2xx、超时、连不上服务端都会抛 `ApiError`，所以拿到 `response` 就意味着成功。每个请求自带 `X-Request-Id`，服务端会沿用它，排障时客户端与服务端日志用同一个 id 对齐。

```ts
const api = createApiClient("/api", {
  headers: () => ({ authorization: `Bearer ${getToken()}` }),
  timeoutMs: 15_000,
});
```

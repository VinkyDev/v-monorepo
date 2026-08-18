# @v-monorepo/api-client

Hono RPC 类型化客户端。浏览器走 `/api` 代理。失败抛 `AppError`。

```ts
import { createBrowserApiClient } from "@v-monorepo/api-client";

const api = createBrowserApiClient();
const response = await api.health.$get();
```

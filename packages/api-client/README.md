# @v-monorepo/api-client

基于 Hono RPC 的类型化客户端。浏览器走 Vite `/api` 代理，并自动注入 `x-request-id`。失败在客户端 fetch 层转为 `AppError`。Web 在 React Query 的 cache `onError` 里 toast，业务调用不必再判断错误。

```ts
import { createBrowserApiClient } from "@v-monorepo/api-client";

const api = createBrowserApiClient();
const response = await api.health.$get();
```

业务侧只有在需要覆盖全局 toast 时才捕获 `AppError` 并按 `error.code` 分支。

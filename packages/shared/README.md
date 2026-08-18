# @v-monorepo/shared

前后端共用的契约：Zod schema、HTTP 约定、错误码目录，以及 `AppError`。

```ts
import { AppError, errorCatalog, healthStatusSchema } from "@v-monorepo/shared";

throw new AppError("NOT_FOUND");
throw new AppError("NOT_FOUND", { message: "未找到小组件 12" });
```

错误码写在 `errorCatalog`。两端都 throw / catch `AppError`，用 `code` 做机器识别，`message` 给人看。RFC 9457 线格式由 `toResponse` / `fromResponse` 处理，调用方不必直接操作 Problem Details。

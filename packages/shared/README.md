# @v-monorepo/shared

前后端共用契约：Zod schema、HTTP 约定、`errorCatalog`、`AppError`。

```ts
import { AppError, healthStatusSchema } from "@v-monorepo/shared";

throw new AppError("NOT_FOUND");
throw new AppError("NOT_FOUND", { message: "未找到小组件 12" });
```

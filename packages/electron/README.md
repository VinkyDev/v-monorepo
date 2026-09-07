# @v-monorepo/electron

桌面桥：IPC 目录、渲染协议、渲染进程访问器。

```ts
import { isDesktop, shellApi } from "@v-monorepo/electron";

if (isDesktop()) {
  await shellApi().openExternal("https://example.com");
}
```

主进程与 preload 在 `apps/desktop`。不需要桌面端时删除 `packages/electron` 和 `apps/desktop`，并去掉 web 里对本包的引用。

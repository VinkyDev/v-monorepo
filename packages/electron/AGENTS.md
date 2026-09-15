# `@v-monorepo/electron`

Desktop bridge. Import from `@v-monorepo/electron`.

IPC catalog (`shell.ts`), renderer protocol (`app://bundle/`), and renderer accessors (`isDesktop()`, `shellApi()`). Main and preload live in `apps/desktop`.

Only `message` survives a throw across `ipcMain.handle`, so every call resolves to an `IpcResult<T>`: preload forwards the envelope, and `shellApi()` unwraps it, throwing the same `ApiError` an HTTP call would. Unwrapping has to happen here rather than in preload, where `contextBridge` would strip the error's fields.

Adding a domain: catalog file here (a `*Bridge` type returning `IpcResult` and a `*Api` type for pages), main `ipc/` handler, preload module on `desktop.<domain>`, accessor on this package.

This slice is optional. Remove `packages/electron` and `apps/desktop` when the product is not a desktop app; also drop the web demo that imports this package.

# `@v-monorepo/electron`

Desktop bridge. Import from `@v-monorepo/electron`.

IPC catalog (`shell.ts`), renderer protocol (`app://bundle/`), and renderer accessors (`isDesktop()`, `shellApi()`). Main and preload live in `apps/desktop`.

Adding a domain: catalog file here, main `ipc/` handler, preload module on `desktop.<domain>`, accessor on this package.

This slice is optional. Remove `packages/electron` and `apps/desktop` when the product is not a desktop app; also drop the web demo that imports this package.

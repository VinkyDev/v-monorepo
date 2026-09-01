# `@v-monorepo/desktop`

Electron shell around `@v-monorepo/web`. Main and preload live here; the renderer is the web app.

- `pnpm dev:desktop` — web Vite, watch-build main/preload, launch Electron
- `pnpm package:desktop` — package the current platform
- Window URL is `app://bundle/`. Main proxies `/api` with Electron `net.fetch` to `API_ORIGIN`; other requests go to Vite (dev) or the static export (prod)
- Preload is CommonJS (`sandbox: true`)
- IPC: one file per domain in `ipc/` (`shell.ts` today), composed by `ipcInit`. New domain: that file, a preload module on `desktop.<domain>`, a shared catalog fragment, and `xApi()` on `@v-monorepo/utils`
- Register channels with `handle` from `ipc/handle.ts`
- Pages call `shellApi()` from `@v-monorepo/utils`
- Log with `@v-monorepo/logger`
- Tests: sender trust, URL allowlist, clipboard limits, renderer routing

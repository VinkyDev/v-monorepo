# `@v-monorepo/desktop`

Electron shell around `@v-monorepo/web`. Main and preload live here; the renderer is the web app.

- `pnpm dev:desktop` — start web Vite, watch-build main/preload, launch Electron
- `pnpm package:desktop` — package the current platform
- Always load `app://bundle/`. `/api` is intercepted in main and proxied with Electron `net.fetch` to `API_ORIGIN`. Other requests go to Vite via Node `fetch` (dev) or the static export (prod)
- Preload stays CommonJS so `sandbox: true` remains on
- IPC is one folder of domain files (`ipc/shell.ts` today), composed by `ipcInit`. Add a domain as a new file there, a matching preload module hung on `desktop.<domain>`, a shared catalog fragment, and `xApi()` in `@v-monorepo/utils`
- Register channels with `handle` from `ipc/handle.ts`, not raw `ipcMain.handle`. Do not expose `ipcRenderer`
- Tests hit domain policy (sender trust, URL allowlist, clipboard limits) and renderer routing, not Electron primitives
- Do not import `electron` from `apps/web`. Pages call `shellApi()` from `@v-monorepo/utils`
- Log with `@v-monorepo/logger`, not `console`

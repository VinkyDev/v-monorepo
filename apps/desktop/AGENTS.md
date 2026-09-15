# `@v-monorepo/desktop`

Electron shell around `@v-monorepo/web`. Main and preload live here; the renderer is the web app. The IPC catalog and renderer accessors live in `@v-monorepo/electron`.

- `pnpm dev:desktop` — web Vite, watch-build main/preload, launch Electron
- `pnpm package:desktop` — package the current platform
- Window URL is `app://bundle/`. Main proxies `/api` with Electron `net.fetch` to `API_ORIGIN`; other requests go to Vite (dev) or the static export (prod)
- Preload is CommonJS (`sandbox: true`). Bundle every dependency except `electron`; a sandboxed preload cannot `require()` npm packages.
- IPC: one file per domain in `ipc/` (`shell.ts`), composed by `ipcInit`. New domain: that file, a preload module on `desktop.<domain>`, and a catalog plus accessor on `@v-monorepo/electron`
- Register channels with `handle` from `ipc/handle.ts`. It wraps the outcome in an `IpcResult`, logs the failure, and degrades anything unclassified to `internal` so the renderer never sees our internals. Throw `ApiError` for anything the renderer should be able to branch on.
- Pages call `shellApi()` from `@v-monorepo/electron`, which throws the `ApiError` back
- Log with `@v-monorepo/logger`; `main/crash.ts` catches what escapes everything else
- Tests: sender trust, URL allowlist, clipboard limits, IPC envelope, renderer routing

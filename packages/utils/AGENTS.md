# `@v-monorepo/utils`

Import local helpers from `@v-monorepo/utils`. Prefer [es-toolkit](https://es-toolkit.dev) (import from `"es-toolkit"` directly); add a local helper only when none exists.

Desktop: `isDesktop()` and per-domain accessors (`shellApi()` today) live in `src/electron.ts`. Pages import them from this package, never `window.desktop`.

Fetch docs before picking, wrapping, or inventing a utility:

- [llms.txt](https://es-toolkit.dev/llms.txt) then the matching page
- [llms-full.txt](https://es-toolkit.dev/llms-full.txt) when the function name is unknown

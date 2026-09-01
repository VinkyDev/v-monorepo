# `@v-monorepo/config`

Shared tsconfig presets. New packages extend a leaf preset. Local `compilerOptions` only for that package's exceptions (paths, extra libs). Packages with `src` set `"@/*": ["./src/*"]` and the matching Vite `resolve.alias`.

- `library` — packages
- `node` — Node apps and scripts
- `react-library` — React packages
- `react-app` — Vite React apps

`base` is the parent of the others.

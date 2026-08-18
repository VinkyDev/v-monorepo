# `@v-monorepo/config`

Shared tsconfig presets. New packages extend a leaf preset; local `compilerOptions` only for that package's exceptions (paths, extra libs).

- `library` — packages
- `node` — Node apps and scripts
- `react-library` — React packages
- `react-app` — Vite React apps

`base` is the parent of the others.

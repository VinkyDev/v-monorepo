# `@v-monorepo/ui`

Shared UI kit. Import by path (`@v-monorepo/ui/components/button`). Import `@v-monorepo/ui/globals.css` once in the app entry. Mount `<Toaster />` from `@v-monorepo/ui/components/toast` once in the app shell. `cn` comes from `@v-monorepo/utils`.

shadcn lives in this package (`components.json`). Run the CLI here — `-c packages/ui` from the repo root.

## CLI

```bash
pnpm dlx shadcn@latest info -c packages/ui
pnpm dlx shadcn@latest search -c packages/ui -q "dialog"
pnpm dlx shadcn@latest docs button -c packages/ui
pnpm dlx shadcn@latest add button -c packages/ui
pnpm dlx shadcn@latest add button --dry-run -c packages/ui
pnpm dlx shadcn@latest add button --diff button.tsx -c packages/ui
```

1. `info` — aliases, base, installed components.
2. `search` — a registry item before writing UI.
3. `docs <name>` — fetch the printed URLs before adding or composing.
4. `add` — install into this package. Preview with `--dry-run` / `--diff`. `--overwrite` only after the user confirms.

**shadcn** — workflow, composition, styling: [SKILL.md](.agents/skills/shadcn/SKILL.md). Flags and dry-run: [cli.md](.agents/skills/shadcn/cli.md).
**Base UI** — primitive APIs: https://base-ui.com/react/overview/quick-start

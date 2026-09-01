# `@v-monorepo/agents`

[Flue](https://flueframework.com) agents as TypeScript functions.

A module under `src/agents/` whose first line is `'use agent'` exports agents: every exported capitalized function is one; the function name is its durable identity. Mount each route in `src/app.ts`.

- `pnpm exec flue run src/agents/hello.ts --message "Hi"` — run locally
- `pnpm exec flue docs search <query>` then `flue docs read <path>`
- `pnpm exec flue add` — blueprints for channels, sandboxes, databases

**Flue** — [docs](https://flueframework.com/docs/) or `pnpm exec flue docs`

# AGENTS.md

This is a [Flue](https://flueframework.com) project: agents are TypeScript functions.

## Layout

- `src/agents/` — agent modules. A module whose first line is the `'use agent'` directive exports agents: every exported capitalized function is one, and the function name is its durable identity.
- `src/app.ts` — the route map; every route is mounted here explicitly. Importing it validates env via `src/env.ts`.
- `src/db.ts` — the persistence adapter for durable conversations.

## Commands

- `vp run --filter @v-monorepo/agents dev` — start the Vite dev server (`http://localhost:5174`).
- `vp run --filter @v-monorepo/agents build` — build `dist/server.mjs` (start it with `vp run --filter @v-monorepo/agents start`).
- `pnpm exec flue run src/agents/hello.ts --message "Hi"` — run an agent locally, no server.
- `vp run --filter @v-monorepo/agents typecheck` — typecheck.
- `pnpm exec flue docs search <query>` — search the Flue docs from the terminal (then `flue docs read <path>`).
- `pnpm exec flue add` — list blueprints for adding channels, sandboxes, and databases.

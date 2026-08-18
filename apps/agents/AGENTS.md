# `@v-monorepo/agents`

[Flue](https://flueframework.com) project: agents are TypeScript functions.

A module under `src/agents/` whose first line is `'use agent'` exports agents: every exported capitalized function is one, and the function name is its durable identity. Mount each route explicitly in `src/app.ts`.

- `pnpm exec flue run src/agents/hello.ts --message "Hi"` — run locally, no server
- `pnpm exec flue docs search <query>` then `flue docs read <path>`
- `pnpm exec flue add` — blueprints for channels, sandboxes, databases

## Learn more

- [Flue docs](https://flueframework.com/docs/) — or `pnpm exec flue docs` from the terminal.

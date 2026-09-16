# `@v-monorepo/agents`

[Mastra](https://mastra.ai) agents. Register each agent in `src/mastra/index.ts`. Models use `"provider/model"`; credentials come from Mastra's provider env vars (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, …). `DATABASE_URL` is validated by T3 Env in `src/env.ts`.

- `pnpm run dev` — Studio + REST at http://localhost:4111. Agent **Editor** and Observability traces are on.
- `pnpm exec mastra api agent list` — inspect the local server
- `pnpm exec mastra api agent generate hello-agent` — talk to Hello

Storage is `PostgresStoreVNext` via `DATABASE_URL` (memory and Studio observability share the same local database). Errors stay on Mastra's own contract. Do not replace them with the repo's `ApiError` envelope — Mastra Studio and `mastra api` parse the former.

**Mastra** — [docs](https://mastra.ai/docs/)

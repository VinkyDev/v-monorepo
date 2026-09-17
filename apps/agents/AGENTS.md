# `@v-monorepo/agents`

[Mastra](https://mastra.ai) agents. Register each agent in `src/mastra/index.ts`. Models use `"provider/model"`; credentials come from Mastra's provider env vars (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, …). An optional OpenAI-compatible gateway is `custom/<model>` (`src/mastra/providers/custom.ts`), configured only by `CUSTOM_BASE_URL`, `CUSTOM_API_KEY`, and `CUSTOM_MODEL_LIST` (comma-separated ids). `DATABASE_URL` is validated by T3 Env in `src/env.ts`. MCP servers live in `src/mastra/mcp.ts` (Wikipedia, no extra keys). Attach skills with `createSkill` from `@mastra/core/skills`.

- `pnpm run dev` — Studio + REST at http://localhost:4111. Agent **Editor** and Observability traces are on. AG-UI chat is `POST /agui/:agentId` (Research: `/agui/research-agent`).
- `pnpm exec mastra api agent list` — inspect the local server
- `pnpm exec mastra api agent generate research-agent` — talk to Research

Storage is `PostgresStoreVNext` via `DATABASE_URL` (memory and Studio observability share the same local database). Errors stay on Mastra's own contract. Do not replace them with the repo's `ApiError` envelope — Mastra Studio and `mastra api` parse the former.

**Mastra** — [docs](https://mastra.ai/docs/)

# @v-monorepo/agents

A [Mastra](https://mastra.ai) agent project. Development is `mastra dev` (Studio + REST). Tests still go through Vite+.

## Setup

```sh
pnpm install
```

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` and `DATABASE_URL`. For an OpenAI-compatible gateway, also set `OPENAI_BASE_URL`. Local Postgres is `postgresql://localhost:5432/mastra` on port 5432.

The Research agent uses `tencent-tokenhub/hy4-preview`. Change the `model` string in `src/mastra/agents/research.ts` to switch models.

MCP servers are started with `npx` and need no extra API keys:

- [Wikipedia](https://www.npmjs.com/package/wikipedia-mcp) — article search and reads

Mastra's `web_fetch` reads a public URL the Wikipedia tools (or the user) point to. DuckDuckGo scrape MCPs are not used — DDG blocks them.

The first Studio start downloads the Wikipedia MCP package. Subsequent starts reuse the npx cache.

## Develop

```sh
pnpm run dev
```

Studio is at http://localhost:4111. The Research agent id is `research-agent`. It loads the `research-brief` skill, then searches live sources and cites them. The web app talks to it over AG-UI at `POST /agui/research-agent`.

```sh
pnpm exec mastra api agent list
pnpm exec mastra api agent generate research-agent
```

## Deploy

```sh
pnpm run build
pnpm run start
```

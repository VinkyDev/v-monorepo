# @v-monorepo/agents

A [Mastra](https://mastra.ai) agent project. Development is `mastra dev` (Studio + REST). Tests still go through Vite+.

## Setup

```sh
pnpm install
```

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` and `DATABASE_URL`. For an OpenAI-compatible gateway, also set `OPENAI_BASE_URL`. Local Postgres is `postgresql://localhost:5432/mastra` on port 5432.

The Hello agent uses `openai/gpt-5.6-luna`. Change the `model` string in `src/mastra/agents/hello.ts` to switch models.

## Develop

```sh
pnpm run dev
```

Studio is at http://localhost:4111. The Hello agent id is `hello-agent`.

```sh
pnpm exec mastra api agent list
```

## Deploy

```sh
pnpm run build
pnpm run start
```

# @v-monorepo/agents

A [Flue](https://flueframework.com) agent project, served locally with Vite.

## Setup

```sh
pnpm install
```

Copy `.env.example` to `.env` and set `PROVIDER_ID`, `MODEL_ID`, and `API_KEY` (any [provider Pi supports](https://pi.dev/docs/latest/providers#api-keys)). For `openai-compat` or `anthropic-compat`, also set `BASE_URL`.

## Develop

```sh
pnpm run dev
```

The Hello agent is served at `http://localhost:5174/agents/hello` — see `src/app.ts` for the route map and an example request.

```sh
curl -X POST http://localhost:5174/agents/hello/my-first-chat \
  -H 'content-type: application/json' \
  -d '{"kind":"user","body":"Tell me a joke."}'
```

## Talk without a server

```sh
pnpm exec flue run src/agents/hello.ts --message "Say hello!"
```

Conversations are durable — pass `--id <id>` to continue one.

## Deploy

```sh
pnpm run build
node dist/server.mjs
```

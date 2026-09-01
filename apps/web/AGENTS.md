# `@v-monorepo/web`

React app (browser and Electron renderer). Call the API with `useQuery(healthQueryOptions())` or the domain factory.

- `src/lib/api.ts` — `createApiClient` singleton
- `src/lib/queries/<domain>.ts` — `queryOptions` / mutation factories; `await response.json()`
- `src/lib/query-client.ts` — retry and toast

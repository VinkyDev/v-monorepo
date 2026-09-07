# `@v-monorepo/web`

React app. Call the API with `useQuery(healthQueryOptions())` or the domain factory.

- `src/lib/api.ts` — `createApiClient` singleton
- `src/lib/queries/<domain>.ts` — `queryOptions` / mutation factories; `await response.json()`
- `src/lib/query-client.ts` — retry and toast

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router. Widgets: `withSuspense(lazyComponent(() => import(...)))`.

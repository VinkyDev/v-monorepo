# `@v-monorepo/web`

React app. Call the API with `useQuery` + `apiClient.<path>.$method()`, then `response.json()`.

- `src/lib/api.ts` — `createApiClient` singleton
- `src/lib/query-client.ts` — retry and toast

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router. Widgets: `withSuspense(lazyComponent(() => import(...)))` — chunk load uses `retry` from `es-toolkit`.

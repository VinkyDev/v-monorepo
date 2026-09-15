# `@v-monorepo/web`

React app. Call the API with `useQuery` + `apiClient.<path>.$method()`, then `response.json()`.

- `src/lib/api.ts` — `createApiClient` singleton
- `src/lib/query-client.ts` — retry, `throwOnError`, and the global error handlers
- `src/lib/api-error-effects.ts` — codes the app answers centrally; a hit means the call site stays quiet
- `src/lib/error-view.ts` — the only place an unknown throw turns into user-facing copy

Error routing: a first load with no data throws to the route error boundary (`ErrorScreen`); a background refresh keeps the stale data and toasts. Mutations toast unless they set `meta: { showErrorToast: false }` and render the failure themselves — see `src/routes/demo.tsx`, which reads `error.data.fields` into the form.

4xx are never reported; 5xx and network failures go to `logger`. Wrap a widget that may fail on its own in `<AppBoundary name="…">`.

File routes auto-split; don't wrap them in `React.lazy`. Route pending/error UI lives on the router. Widgets: `withSuspense(lazy(() => import(...)))` — a chunk that 404s after a deploy is handled by the `vite:preloadError` listener in `main.tsx`, not by retrying.

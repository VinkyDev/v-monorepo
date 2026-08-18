# `@v-monorepo/utils`

Import utilities from `@v-monorepo/utils`. Lodash-compat APIs from `@v-monorepo/utils/compat`. Subpaths match es-toolkit plus `./cn`.

Reach for an [es-toolkit](https://es-toolkit.dev) export first. Add a local helper only when none exists — `cn` merges Tailwind classes (`clsx` + `tailwind-merge`).

```ts
import { chunk, cn, sum } from "@v-monorepo/utils";
import { get } from "@v-monorepo/utils/compat";
```

## Lookup

Fetch es-toolkit docs before picking, wrapping, or inventing a utility:

- **API** — [llms.txt](https://es-toolkit.dev/llms.txt) (index), then the matching page
- **recommend** — [llms-full.txt](https://es-toolkit.dev/llms-full.txt) when the function name is unknown

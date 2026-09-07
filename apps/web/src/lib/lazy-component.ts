import { withRetry } from "@v-monorepo/utils";
import type { RetryTask } from "@v-monorepo/utils";
import { lazy } from "react";
import type { ComponentType } from "react";

import { env } from "#/env.ts";

export const lazyComponent = <Props extends object>(
  load: RetryTask<{ default: ComponentType<Props> }>
) => lazy(withRetry(load, { retries: env.VITE_MAX_RETRY_COUNT }));

import { retry } from "es-toolkit";
import { lazy } from "react";
import type { ComponentType } from "react";

import { env } from "#/env.ts";

export const lazyComponent = <Props extends object>(
  load: () => Promise<{ default: ComponentType<Props> }>
) => lazy(async () => await retry(load, { retries: env.VITE_MAX_RETRY_COUNT }));

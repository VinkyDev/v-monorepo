import type { ApiErrorBody } from "@v-monorepo/shared";

export type IpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiErrorBody };

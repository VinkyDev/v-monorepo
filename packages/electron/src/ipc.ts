import type { ApiErrorBody } from "@v-monorepo/shared";

/**
 * Only `message` survives a throw across `ipcMain.handle`, so handlers return a
 * result and the renderer rebuilds the `ApiError` from the wire body HTTP uses.
 */
export type IpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiErrorBody };

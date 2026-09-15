import type { IpcResult } from "@v-monorepo/electron";
import { logger, toError } from "@v-monorepo/logger";
import { ApiError, isApiError } from "@v-monorepo/shared";
import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { z } from "zod";

import { isTrustedRendererUrl } from "#/main/urls.ts";

const ipcArgListSchema = z.array(z.string());

type Handler<T> = (
  event: IpcMainInvokeEvent,
  ...args: string[]
) => T | Promise<T>;

export const assertSender = (senderUrl?: string): void => {
  if (senderUrl === undefined || !isTrustedRendererUrl(senderUrl)) {
    throw new ApiError("forbidden", { message: "untrusted ipc sender" });
  }
};

/** Turns a handler outcome into the envelope, because only `message` survives a throw. */
export const toIpcResult = async <T>(
  channel: string,
  run: () => T | Promise<T>
): Promise<IpcResult<T>> => {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    // The renderer is a separate trust boundary: anything we did not classify
    // becomes a generic internal error rather than leaking our internals.
    const failure = isApiError(error)
      ? error
      : new ApiError("internal", { cause: error });
    logger.error({
      error: toError(error),
      event: "ipc_handler_failed",
      message: `${channel} -> ${failure.code}`,
      meta: { channel },
    });
    return { error: failure.toBody(), ok: false };
  }
};

export const handle = <T>(channel: string, listener: Handler<T>): void => {
  ipcMain.handle(
    channel,
    async (event, ...args) =>
      await toIpcResult(channel, (): T | Promise<T> => {
        assertSender(event.senderFrame?.url);
        return listener(event, ...ipcArgListSchema.parse(args));
      })
  );
};

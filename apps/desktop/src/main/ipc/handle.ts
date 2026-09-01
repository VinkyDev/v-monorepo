import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { z } from "zod";

import { isTrustedRendererUrl } from "#/main/urls.ts";

const ipcArgListSchema = z.array(z.string());

type Handler = (
  event: IpcMainInvokeEvent,
  ...args: string[]
) => string | Promise<string> | Promise<void>;

export const assertSender = (senderUrl?: string): void => {
  if (senderUrl === undefined || !isTrustedRendererUrl(senderUrl)) {
    throw new Error("untrusted ipc sender");
  }
};

export const handle = (channel: string, listener: Handler): void => {
  ipcMain.handle(channel, (event, ...args): ReturnType<Handler> => {
    assertSender(event.senderFrame?.url);
    return listener(event, ...ipcArgListSchema.parse(args));
  });
};

import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import { isTrustedRendererUrl } from "#/main/urls.ts";

const ipcArgListSchema = z.array(z.string());

type Handler = (
  event: IpcMainInvokeEvent,
  ...args: string[]
) => string | void | Promise<string | void>;

export function assertSender(senderUrl: string | undefined): void {
  if (senderUrl === undefined || !isTrustedRendererUrl(senderUrl)) {
    throw new Error("untrusted ipc sender");
  }
}

export function handle(channel: string, listener: Handler): void {
  ipcMain.handle(channel, (event, ...args) => {
    assertSender(event.senderFrame?.url);
    return listener(event, ...ipcArgListSchema.parse(args));
  });
}

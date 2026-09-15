import { shellCapabilities } from "@v-monorepo/electron";
import type { IpcResult, ShellBridge } from "@v-monorepo/electron";
import { errorBodySchema } from "@v-monorepo/shared";
import { ipcRenderer } from "electron";
import { z } from "zod";

const failureSchema = z.object({
  error: errorBodySchema,
  ok: z.literal(false),
});

const invoke = async <Value>(
  valueSchema: z.ZodType<Value>,
  channel: string,
  ...args: string[]
): Promise<IpcResult<Value>> =>
  z
    .union([
      z.object({ ok: z.literal(true), value: valueSchema }),
      failureSchema,
    ])
    .parse(await ipcRenderer.invoke(channel, ...args));

const nothing = z.undefined();
const text = z.string();

export const shellApi: ShellBridge = {
  getElectronVersion: async () =>
    await invoke(text, shellCapabilities.getElectronVersion.channel),
  openExternal: async (url) =>
    await invoke(nothing, shellCapabilities.openExternal.channel, url),
  readClipboardText: async () =>
    await invoke(text, shellCapabilities.readClipboardText.channel),
  writeClipboardText: async (value) =>
    await invoke(nothing, shellCapabilities.writeClipboardText.channel, value),
};

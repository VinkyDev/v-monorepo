import { shellCapabilities } from "@v-monorepo/electron";
import type { ShellApi } from "@v-monorepo/electron";
import { ipcRenderer } from "electron";
import { z } from "zod";

export const shellApi: ShellApi = {
  getElectronVersion: async () =>
    z
      .string()
      .parse(
        await ipcRenderer.invoke(shellCapabilities.getElectronVersion.channel)
      ),
  openExternal: async (url) => {
    await ipcRenderer.invoke(shellCapabilities.openExternal.channel, url);
  },
  readClipboardText: async () =>
    z
      .string()
      .parse(
        await ipcRenderer.invoke(shellCapabilities.readClipboardText.channel)
      ),
  writeClipboardText: async (text) => {
    await ipcRenderer.invoke(
      shellCapabilities.writeClipboardText.channel,
      text
    );
  },
};

import { ipcRenderer } from "electron";
import { shellCapabilities, type ShellApi } from "@v-monorepo/shared/electron";

export const shellApi: ShellApi = {
  getElectronVersion: () => ipcRenderer.invoke(shellCapabilities.getElectronVersion.channel),
  openExternal: (url) => ipcRenderer.invoke(shellCapabilities.openExternal.channel, url),
  readClipboardText: () => ipcRenderer.invoke(shellCapabilities.readClipboardText.channel),
  writeClipboardText: (text) =>
    ipcRenderer.invoke(shellCapabilities.writeClipboardText.channel, text),
};

import { ApiError } from "@v-monorepo/shared";

import { desktopBridgeGlobal } from "./bridge.ts";
import type { DesktopApi } from "./bridge.ts";
import type { IpcResult } from "./ipc.ts";
import type { ShellApi } from "./shell.ts";

type DesktopGlobalThis = typeof globalThis & {
  desktop?: DesktopApi;
};

const getDesktopBridge = (): DesktopApi | undefined => {
  // SAFETY: preload attaches DesktopApi under desktopBridgeGlobal; browsers leave it unset.
  const globals = globalThis as DesktopGlobalThis;
  return globals[desktopBridgeGlobal];
};

const requireDesktop = (): DesktopApi => {
  const desktop = getDesktopBridge();
  if (desktop === undefined) {
    throw new Error("desktop bridge is unavailable");
  }
  return desktop;
};

/** Rebuilt here rather than in preload, where `contextBridge` would strip the fields. */
const unwrap = <T>(result: IpcResult<T>): T => {
  if (result.ok) {
    return result.value;
  }
  // No HTTP status on this transport, so a code we do not know degrades to `internal`.
  throw ApiError.fromBody(result.error, "internal");
};

export const isDesktop = (): boolean => getDesktopBridge() !== undefined;

export const shellApi = (): ShellApi => {
  const { shell } = requireDesktop();
  return {
    getElectronVersion: async () => unwrap(await shell.getElectronVersion()),
    openExternal: async (url) => {
      unwrap(await shell.openExternal(url));
    },
    readClipboardText: async () => unwrap(await shell.readClipboardText()),
    writeClipboardText: async (text) => {
      unwrap(await shell.writeClipboardText(text));
    },
  };
};

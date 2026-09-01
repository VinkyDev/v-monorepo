import { desktopBridgeGlobal } from "@v-monorepo/shared/electron";
import type { DesktopApi, ShellApi } from "@v-monorepo/shared/electron";

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

export const isDesktop = (): boolean => getDesktopBridge() !== undefined;

export const shellApi = (): ShellApi => requireDesktop().shell;

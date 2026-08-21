import { desktopBridgeGlobal, type DesktopApi, type ShellApi } from "@v-monorepo/shared/electron";

type DesktopGlobalThis = typeof globalThis & {
  desktop?: DesktopApi;
};

function getDesktopBridge(): DesktopApi | undefined {
  // SAFETY: preload attaches DesktopApi under desktopBridgeGlobal; browsers leave it unset.
  const globals = globalThis as DesktopGlobalThis;
  return globals[desktopBridgeGlobal];
}

function requireDesktop(): DesktopApi {
  const desktop = getDesktopBridge();
  if (desktop === undefined) {
    throw new Error("desktop bridge is unavailable");
  }
  return desktop;
}

export function isDesktop(): boolean {
  return getDesktopBridge() !== undefined;
}

export function shellApi(): ShellApi {
  return requireDesktop().shell;
}

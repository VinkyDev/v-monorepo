import type { ShellBridge } from "./shell.ts";

export const desktopBridgeGlobal = "desktop";

export interface DesktopApi {
  shell: ShellBridge;
}

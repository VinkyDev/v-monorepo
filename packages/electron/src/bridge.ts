import type { ShellApi } from "./shell.ts";

export const desktopBridgeGlobal = "desktop";

export interface DesktopApi {
  shell: ShellApi;
}

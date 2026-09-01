import type { ShellApi } from "./shell.ts";

export * from "./shell.ts";
export {
  productionRendererUrl,
  rendererHost,
  rendererOrigin,
  rendererProtocol,
  rendererScheme,
} from "./renderer.ts";

export const desktopBridgeGlobal = "desktop";

export interface DesktopApi {
  shell: ShellApi;
}

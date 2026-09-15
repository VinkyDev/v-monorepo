export { isDesktop, shellApi } from "./accessor.ts";
export { desktopBridgeGlobal, type DesktopApi } from "./bridge.ts";
export type { IpcResult } from "./ipc.ts";
export {
  productionRendererUrl,
  rendererHost,
  rendererOrigin,
  rendererProtocol,
  rendererScheme,
} from "./renderer.ts";
export type {
  ShellApi,
  ShellBridge,
  ShellCapability,
  ShellCapabilityName,
} from "./shell.ts";
export { shellCapabilities } from "./shell.ts";

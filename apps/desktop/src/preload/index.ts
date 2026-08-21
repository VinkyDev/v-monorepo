import { contextBridge } from "electron";
import { desktopBridgeGlobal, type DesktopApi } from "@v-monorepo/shared/electron";
import { shellApi } from "./shell.ts";

const desktop: DesktopApi = {
  shell: shellApi,
};

contextBridge.exposeInMainWorld(desktopBridgeGlobal, desktop);

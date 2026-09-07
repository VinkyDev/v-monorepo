import { desktopBridgeGlobal } from "@v-monorepo/electron";
import type { DesktopApi } from "@v-monorepo/electron";
import { contextBridge } from "electron";

import { shellApi } from "./shell.ts";

const desktop: DesktopApi = {
  shell: shellApi,
};

contextBridge.exposeInMainWorld(desktopBridgeGlobal, desktop);

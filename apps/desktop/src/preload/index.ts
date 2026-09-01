import { desktopBridgeGlobal } from "@v-monorepo/shared/electron";
import type { DesktopApi } from "@v-monorepo/shared/electron";
import { contextBridge } from "electron";

import { shellApi } from "./shell.ts";

const desktop: DesktopApi = {
  shell: shellApi,
};

contextBridge.exposeInMainWorld(desktopBridgeGlobal, desktop);

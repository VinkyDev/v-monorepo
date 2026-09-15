import { productionRendererUrl } from "@v-monorepo/electron";
import { logger } from "@v-monorepo/logger";
import { BrowserWindow } from "electron";

import { setupCorsBypass } from "#/main/cors.ts";
import { isTrustedRendererUrl } from "#/main/urls.ts";

const log = logger.child({ scope: "desktop" });

const denyUntrusted = (details: {
  preventDefault: () => void;
  url: string;
}): void => {
  if (!isTrustedRendererUrl(details.url)) {
    details.preventDefault();
  }
};

export const createMainWindow = (preloadFile: string): BrowserWindow => {
  const win = new BrowserWindow({
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadFile,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
    width: 1280,
  });

  setupCorsBypass(win.webContents.session);

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler((details) => {
    if (isTrustedRendererUrl(details.url)) {
      return { action: "allow" };
    }
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", denyUntrusted);
  win.webContents.on("will-redirect", denyUntrusted);

  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    log.error({
      error,
      event: "preload_failed",
      message: `preload failed: ${preloadPath}`,
    });
  });

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      // -3 is ERR_ABORTED, which every in-app navigation produces.
      if (errorCode === -3) {
        return;
      }
      log.error({
        error: new Error(errorDescription),
        event: "renderer_load_failed",
        message: `failed to load ${validatedURL}: ${errorDescription}`,
        meta: { errorCode },
      });
    }
  );

  void win.loadURL(productionRendererUrl);
  return win;
};

import { createLogger } from "@v-monorepo/logger";
import { productionRendererUrl } from "@v-monorepo/shared/electron";
import { BrowserWindow } from "electron";

import { setupCorsBypass } from "#/main/cors.ts";
import { isTrustedRendererUrl } from "#/main/urls.ts";

const log = createLogger({ name: "desktop" });

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

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -3) {
        return;
      }
      log.error(
        `failed to load ${validatedURL}: ${errorDescription} (${errorCode})`
      );
    }
  );

  void win.loadURL(productionRendererUrl);
  return win;
};

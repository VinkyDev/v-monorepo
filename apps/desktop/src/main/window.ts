import { BrowserWindow } from "electron";
import { createLogger } from "@v-monorepo/logger";
import { productionRendererUrl } from "@v-monorepo/shared/electron";
import { setupCorsBypass } from "@/main/cors.ts";
import { isTrustedRendererUrl } from "@/main/urls.ts";

const log = createLogger({ name: "desktop" });

export function createMainWindow(preloadFile: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: preloadFile,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
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

  const denyUntrusted = (event: { preventDefault: () => void }, url: string): void => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
    }
  };
  win.webContents.on("will-navigate", denyUntrusted);
  win.webContents.on("will-redirect", denyUntrusted);

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) {
      return;
    }
    log.error(`failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });

  void win.loadURL(productionRendererUrl);
  return win;
}

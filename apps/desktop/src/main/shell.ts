import path from "node:path";

import { app, BrowserWindow } from "electron";

import { ipcInit } from "#/main/ipc/index.ts";
import { registerRendererScheme, serveRenderer } from "#/main/renderer.ts";
import { createMainWindow } from "#/main/window.ts";

const preloadFile = (): string =>
  path.join(import.meta.dirname, "../preload/index.cjs");

const rendererRoot = (): string =>
  path.join(import.meta.dirname, "../renderer");

const startDesktop = async (): Promise<void> => {
  await app.whenReady();
  serveRenderer({
    apiOrigin: process.env.API_ORIGIN,
    rendererRoot: rendererRoot(),
    viteOrigin: app.isPackaged ? undefined : process.env.ELECTRON_RENDERER_URL,
  });
  ipcInit();
  createMainWindow(preloadFile());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(preloadFile());
    }
  });
};

export const bootDesktop = (): void => {
  registerRendererScheme();

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  void startDesktop();
};

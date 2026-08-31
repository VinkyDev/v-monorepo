import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { ipcInit } from "#/main/ipc/index.ts";
import { registerRendererScheme, serveRenderer } from "#/main/renderer.ts";
import { createMainWindow } from "#/main/window.ts";

function preloadFile(): string {
  return join(import.meta.dirname, "../preload/index.cjs");
}

function rendererRoot(): string {
  return join(import.meta.dirname, "../renderer");
}

export function bootDesktop(): void {
  registerRendererScheme();

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  void startDesktop();
}

async function startDesktop(): Promise<void> {
  await app.whenReady();
  serveRenderer({
    rendererRoot: rendererRoot(),
    apiOrigin: process.env.API_ORIGIN,
    viteOrigin: app.isPackaged ? undefined : process.env.ELECTRON_RENDERER_URL,
  });
  ipcInit();
  createMainWindow(preloadFile());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(preloadFile());
    }
  });
}

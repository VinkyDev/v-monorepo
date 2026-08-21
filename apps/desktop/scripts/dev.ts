import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createLogger } from "@v-monorepo/logger";
import { build } from "vite-plus";

const log = createLogger({ name: "desktop-dev" });

const desktopRoot = join(import.meta.dirname, "..");
const repoRoot = join(desktopRoot, "../..");
const webRoot = join(desktopRoot, "../web");
const rendererPort = 5173;
const rendererUrl = `http://127.0.0.1:${rendererPort}/`;
const bundleQuietMs = 400;
const restartGraceMs = 1_500;
const initialTimeoutMs = 120_000;
const binExt = process.platform === "win32" ? ".cmd" : "";
const vpBin = join(repoRoot, "node_modules/.bin", `vp${binExt}`);
const require = createRequire(join(desktopRoot, "package.json"));
// SAFETY: electron's CJS entry exports the absolute path to the binary.
const electronBin = require("electron") as string;

type ViteWatchEvent = {
  code: string;
};

type ViteWatcher = {
  close: () => Promise<void>;
  on: (event: "event", listener: (watchEvent: ViteWatchEvent) => void) => void;
};

const children: ChildProcess[] = [];
const watchers: ViteWatcher[] = [];
let electronChild: ChildProcess | undefined;
let shuttingDown = false;
let restarting = false;
let acceptRestarts = false;
let restartTimer: ReturnType<typeof setTimeout> | undefined;

function spawnVp(cwd: string, args: string[]): ChildProcess {
  const child = spawn(vpBin, args, { cwd, stdio: "inherit", env: process.env });
  children.push(child);
  child.on("exit", (code) => {
    if (!shuttingDown && code !== null && code !== 0) {
      shutdown(code);
    }
  });
  return child;
}

async function isHttpUp(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntil(label: string, check: () => Promise<boolean> | boolean): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < initialTimeoutMs) {
    if (await check()) {
      return;
    }
    await delay(200);
  }
  throw new Error(`[desktop-dev] ${label} did not become ready in time`);
}

async function ensureWebDevServer(): Promise<void> {
  if (await isHttpUp(rendererUrl)) {
    log.info("reusing existing web dev server");
    return;
  }
  spawnVp(webRoot, ["dev", "--host", "127.0.0.1", "--port", String(rendererPort), "--strictPort"]);
  await waitUntil("web dev server", () => isHttpUp(rendererUrl));
}

function startElectron(): void {
  electronChild = spawn(electronBin, ["."], {
    cwd: desktopRoot,
    stdio: "inherit",
    env: { ...process.env, ELECTRON_RENDERER_URL: rendererUrl },
  });
  electronChild.on("exit", (code) => {
    electronChild = undefined;
    if (shuttingDown) {
      return;
    }
    if (restarting) {
      restarting = false;
      startElectron();
      return;
    }
    shutdown(code ?? 0);
  });
}

function scheduleRestart(): void {
  if (shuttingDown || !acceptRestarts) {
    return;
  }
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    log.info("restarting electron");
    if (electronChild === undefined) {
      startElectron();
      return;
    }
    restarting = true;
    electronChild.kill();
  }, bundleQuietMs);
}

function isWatchCycleEnd(code: string): boolean {
  return code === "END";
}

async function watchElectronTarget(configFile: string): Promise<void> {
  const result = await build({
    configFile,
    root: desktopRoot,
    mode: "development",
    build: { watch: {} },
  });
  // SAFETY: Vite watch mode returns a Rollup watcher, not a one-shot bundle.
  const watcher = result as ViteWatcher;
  watchers.push(watcher);

  await new Promise<void>((resolve) => {
    let ready = false;
    watcher.on("event", (watchEvent) => {
      if (!isWatchCycleEnd(watchEvent.code)) {
        return;
      }
      if (!ready) {
        ready = true;
        resolve();
        return;
      }
      scheduleRestart();
    });
  });
}

function shutdown(code: number): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  clearTimeout(restartTimer);
  for (const child of children) {
    child.kill();
  }
  for (const watcher of watchers) {
    void watcher.close();
  }
  electronChild?.kill();
  process.exit(code);
}

async function main(): Promise<void> {
  process.on("SIGINT", () => {
    shutdown(0);
  });
  process.on("SIGTERM", () => {
    shutdown(0);
  });

  await ensureWebDevServer();
  await Promise.all([
    watchElectronTarget(join(desktopRoot, "vite.main.config.ts")),
    watchElectronTarget(join(desktopRoot, "vite.preload.config.ts")),
  ]);
  startElectron();
  await delay(restartGraceMs);
  acceptRestarts = true;
}

await main();

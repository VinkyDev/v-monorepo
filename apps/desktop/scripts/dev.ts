import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createLogger } from "@v-monorepo/logger";
import { build } from "vite-plus";
import { z } from "zod";

const log = createLogger({ name: "desktop-dev" });

const desktopRoot = path.join(import.meta.dirname, "..");
const repoRoot = path.join(desktopRoot, "../..");
const webRoot = path.join(desktopRoot, "../web");
const rendererPort = 5173;
const rendererUrl = `http://127.0.0.1:${rendererPort}/`;
const bundleQuietMs = 400;
const restartGraceMs = 1500;
const initialTimeoutMs = 120_000;
const watchPollMs = 50;
const binExt = process.platform === "win32" ? ".cmd" : "";
const vpBin = path.join(repoRoot, "node_modules/.bin", `vp${binExt}`);
const require = createRequire(path.join(desktopRoot, "package.json"));
// electron's CJS entry exports the absolute path to the binary.
const electronBin = z.string().parse(require("electron"));

type BuildResult = Awaited<ReturnType<typeof build>>;
type WatchBuildResult = Extract<BuildResult, { close: () => Promise<void> }>;

const children: ChildProcess[] = [];
const watchers: WatchBuildResult[] = [];
let electronChild: ChildProcess | undefined;
let shuttingDown = false;
let restarting = false;
let acceptRestarts = false;
let restartTimer: ReturnType<typeof setTimeout> | undefined;

const shutdown = (code: number): void => {
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
};

const spawnVp = (cwd: string, args: string[]): ChildProcess => {
  const child = spawn(vpBin, args, { cwd, env: process.env, stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (!shuttingDown && code !== null && code !== 0) {
      shutdown(code);
    }
  });
  return child;
};

const isHttpUp = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

const waitUntil = async (
  label: string,
  check: () => Promise<boolean> | boolean
): Promise<void> => {
  const started = Date.now();
  const poll = async (): Promise<void> => {
    if (Date.now() - started >= initialTimeoutMs) {
      throw new Error(`[desktop-dev] ${label} did not become ready in time`);
    }
    if (await check()) {
      return;
    }
    await delay(200);
    await poll();
  };
  await poll();
};

const ensureWebDevServer = async (): Promise<void> => {
  if (await isHttpUp(rendererUrl)) {
    log.info("reusing existing web dev server");
    return;
  }
  spawnVp(webRoot, [
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    String(rendererPort),
    "--strictPort",
  ]);
  await waitUntil("web dev server", async () => await isHttpUp(rendererUrl));
};

const startElectron = (): void => {
  electronChild = spawn(electronBin, ["."], {
    cwd: desktopRoot,
    env: { ...process.env, ELECTRON_RENDERER_URL: rendererUrl },
    stdio: "inherit",
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
};

const scheduleRestart = (): void => {
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
};

const isWatchCycleEnd = (code: string): boolean => code === "END";

const isWatchBuildResult = (result: BuildResult): result is WatchBuildResult =>
  "close" in result;

const watchElectronTarget = async (configFile: string): Promise<void> => {
  const result = await build({
    build: { watch: {} },
    configFile,
    mode: "development",
    root: desktopRoot,
  });
  if (!isWatchBuildResult(result)) {
    throw new Error("[desktop-dev] vite watch build did not return a watcher");
  }
  watchers.push(result);

  let ready = false;
  result.on("event", (watchEvent) => {
    if (!isWatchCycleEnd(watchEvent.code)) {
      return;
    }
    if (!ready) {
      ready = true;
      return;
    }
    scheduleRestart();
  });

  const waitForFirstBundle = async (): Promise<void> => {
    if (ready) {
      return;
    }
    await delay(watchPollMs);
    await waitForFirstBundle();
  };
  await waitForFirstBundle();
};

const main = async (): Promise<void> => {
  process.on("SIGINT", () => {
    shutdown(0);
  });
  process.on("SIGTERM", () => {
    shutdown(0);
  });

  await ensureWebDevServer();
  await Promise.all([
    watchElectronTarget(path.join(desktopRoot, "vite.main.config.ts")),
    watchElectronTarget(path.join(desktopRoot, "vite.preload.config.ts")),
  ]);
  startElectron();
  await delay(restartGraceMs);
  acceptRestarts = true;
};

await main();

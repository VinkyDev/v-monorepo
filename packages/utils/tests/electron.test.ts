import { desktopBridgeGlobal } from "@v-monorepo/shared/electron";
import type { DesktopApi, ShellApi } from "@v-monorepo/shared/electron";
import { describe, expect, test } from "vite-plus/test";

import { isDesktop, shellApi } from "#/electron.ts";

type DesktopGlobalThis = typeof globalThis & {
  desktop?: DesktopApi;
};

// SAFETY: tests install a fake preload API on the same global the bridge reads.
const desktopGlobals = (): DesktopGlobalThis => globalThis;

const withDesktopApi = async (
  api: DesktopApi | undefined,
  run: () => Promise<void>
): Promise<void> => {
  const globals = desktopGlobals();
  const previous = globals[desktopBridgeGlobal];
  globals[desktopBridgeGlobal] = api;
  try {
    await run();
  } finally {
    globals[desktopBridgeGlobal] = previous;
  }
};

const fakeShell = (opened: string[]): ShellApi => ({
  getElectronVersion: async () => await Promise.resolve("43.4.1"),
  openExternal: async (url: string) => {
    opened.push(url);
    await Promise.resolve();
  },
  readClipboardText: async () => await Promise.resolve("clipped"),
  writeClipboardText: async () => {
    await Promise.resolve();
  },
});

describe("desktop bridge", () => {
  test("desktop bridge is unavailable without preload", async () => {
    await withDesktopApi(undefined, async () => {
      expect(isDesktop()).toBeFalsy();
      expect(() => shellApi()).toThrow("desktop bridge is unavailable");
      await Promise.resolve();
    });
  });

  test("shellApi methods call through the preload API", async () => {
    const opened: string[] = [];
    await withDesktopApi({ shell: fakeShell(opened) }, async () => {
      expect(isDesktop()).toBeTruthy();
      await expect(shellApi().getElectronVersion()).resolves.toBe("43.4.1");
      await expect(shellApi().readClipboardText()).resolves.toBe("clipped");
      await shellApi().writeClipboardText("hello");
      await shellApi().openExternal("https://example.com");
      expect(opened).toStrictEqual(["https://example.com"]);
    });
  });
});

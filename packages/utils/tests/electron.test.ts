import { desktopBridgeGlobal, type DesktopApi, type ShellApi } from "@v-monorepo/shared/electron";
import { expect, test } from "vite-plus/test";
import { isDesktop, shellApi } from "#/electron.ts";

type DesktopGlobalThis = typeof globalThis & {
  desktop?: DesktopApi;
};

function desktopGlobals(): DesktopGlobalThis {
  // SAFETY: tests install a fake preload API on the same global the bridge reads.
  return globalThis as DesktopGlobalThis;
}

async function withDesktopApi(
  api: DesktopApi | undefined,
  run: () => Promise<void>,
): Promise<void> {
  const globals = desktopGlobals();
  const previous = globals[desktopBridgeGlobal];
  if (api === undefined) {
    delete globals[desktopBridgeGlobal];
  } else {
    globals[desktopBridgeGlobal] = api;
  }
  try {
    await run();
  } finally {
    globals[desktopBridgeGlobal] = previous;
  }
}

function fakeShell(opened: string[]): ShellApi {
  return {
    getElectronVersion: () => Promise.resolve("43.4.1"),
    openExternal: (url: string) => {
      opened.push(url);
      return Promise.resolve();
    },
    readClipboardText: () => Promise.resolve("clipped"),
    writeClipboardText: () => Promise.resolve(),
  };
}

test("desktop bridge is unavailable without preload", async () => {
  await withDesktopApi(undefined, () => {
    expect(isDesktop()).toBe(false);
    expect(() => shellApi()).toThrow("desktop bridge is unavailable");
    return Promise.resolve();
  });
});

test("shellApi methods call through the preload API", async () => {
  const opened: string[] = [];
  await withDesktopApi({ shell: fakeShell(opened) }, async () => {
    expect(isDesktop()).toBe(true);
    expect(await shellApi().getElectronVersion()).toBe("43.4.1");
    expect(await shellApi().readClipboardText()).toBe("clipped");
    await shellApi().writeClipboardText("hello");
    await shellApi().openExternal("https://example.com");
    expect(opened).toEqual(["https://example.com"]);
  });
});

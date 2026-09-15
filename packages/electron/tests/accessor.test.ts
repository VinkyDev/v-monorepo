import { ApiError, isApiError } from "@v-monorepo/shared";
import { describe, expect, test } from "vite-plus/test";

import { desktopBridgeGlobal, isDesktop, shellApi } from "#/index.ts";
import type { DesktopApi, ShellBridge } from "#/index.ts";

// The fake preload API is installed on the same global the bridge reads.
type DesktopGlobalThis = typeof globalThis & { desktop?: DesktopApi };

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

const fakeShell = (opened: string[]): ShellBridge => ({
  getElectronVersion: async () =>
    await Promise.resolve({ ok: true, value: "43.4.1" }),
  openExternal: async (url: string) => {
    opened.push(url);
    return await Promise.resolve({
      error: new ApiError("bad_request", {
        message: "blocked external url",
      }).toBody(),
      ok: false,
    });
  },
  readClipboardText: async () =>
    await Promise.resolve({ ok: true, value: "clipped" }),
  writeClipboardText: async () =>
    await Promise.resolve({ ok: true, value: undefined }),
});

describe("desktop bridge", () => {
  test("desktop bridge is unavailable without preload", async () => {
    await withDesktopApi(undefined, async () => {
      expect(isDesktop()).toBeFalsy();
      expect(() => shellApi()).toThrow("desktop bridge is unavailable");
      await Promise.resolve();
    });
  });

  test("shellApi unwraps a successful envelope", async () => {
    await withDesktopApi({ shell: fakeShell([]) }, async () => {
      expect(isDesktop()).toBeTruthy();
      await expect(shellApi().getElectronVersion()).resolves.toBe("43.4.1");
      await expect(shellApi().readClipboardText()).resolves.toBe("clipped");
      await shellApi().writeClipboardText("hello");
    });
  });

  test("a failed envelope becomes the same ApiError the server would throw", async () => {
    const opened: string[] = [];

    await withDesktopApi({ shell: fakeShell(opened) }, async () => {
      const rejected = shellApi().openExternal("file:///etc/passwd");

      await expect(rejected).rejects.toSatisfy(isApiError);
      await expect(rejected).rejects.toMatchObject({
        code: "bad_request",
        message: "blocked external url",
        status: 400,
      });
      expect(opened).toStrictEqual(["file:///etc/passwd"]);
    });
  });
});

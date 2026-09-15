import type { LogRecord } from "@v-monorepo/logger";
import { collectLogs } from "@v-monorepo/logger/testing";
import { ApiError, errorCatalog } from "@v-monorepo/shared";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { z } from "zod";

import { assertSender, toIpcResult } from "#/main/ipc/handle.ts";
import { parseClipboardText, parseExternalUrl } from "#/main/ipc/shell.ts";

describe("ipc shell policy", () => {
  test("ipc sender must be the renderer origin", () => {
    expect(() => {
      assertSender("https://evil.example/");
    }).toThrow("untrusted ipc sender");
    expect(() => {
      assertSender();
    }).toThrow("untrusted ipc sender");
    expect(() => {
      assertSender("http://127.0.0.1:5173/");
    }).toThrow("untrusted ipc sender");
    expect(() => {
      assertSender("app://bundle/");
    }).not.toThrow();
    expect(() => {
      assertSender("app://bundle/settings");
    }).not.toThrow();
  });

  test("openExternal allows http and mailto, rejects the rest", () => {
    const scriptUrl = ["javascript", ":alert(1)"].join("");
    expect(parseExternalUrl("https://example.com")).toBe("https://example.com");
    expect(parseExternalUrl("mailto:dev@example.com")).toBe(
      "mailto:dev@example.com"
    );
    expect(() => parseExternalUrl(scriptUrl)).toThrow("blocked external url");
    expect(() => parseExternalUrl("file:///etc/passwd")).toThrow(
      "blocked external url"
    );
  });

  test("clipboard write rejects oversized text", () => {
    expect(() => parseClipboardText("x".repeat(1_048_577))).toThrow(z.ZodError);
  });
});

describe(toIpcResult, () => {
  let logs: LogRecord[] = [];

  beforeEach(() => {
    logs = collectLogs();
  });

  test("wraps a value", async () => {
    await expect(
      toIpcResult("app:probe", () => "43.4.1")
    ).resolves.toStrictEqual({ ok: true, value: "43.4.1" });
    expect(logs).toHaveLength(0);
  });

  test("keeps a classified failure and logs it", async () => {
    await expect(
      toIpcResult("app:probe", () => {
        throw new ApiError("forbidden", { message: "untrusted ipc sender" });
      })
    ).resolves.toStrictEqual({
      error: { code: "forbidden", message: "untrusted ipc sender" },
      ok: false,
    });
    expect(logs).toMatchObject([
      { event: "ipc_handler_failed", meta: { channel: "app:probe" } },
    ]);
  });

  test("degrades an unclassified failure to internal", async () => {
    await expect(
      toIpcResult("app:probe", () => {
        throw new Error("secret internals");
      })
    ).resolves.toStrictEqual({
      error: { code: "internal", message: errorCatalog.internal.message },
      ok: false,
    });
  });
});

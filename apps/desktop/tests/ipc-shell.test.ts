import { describe, expect, test } from "vite-plus/test";
import { z } from "zod";

import { assertSender } from "#/main/ipc/handle.ts";
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

import { expect, test } from "vite-plus/test";
import { parseClipboardText, parseExternalUrl } from "#/main/ipc/shell.ts";
import { assertSender } from "#/main/ipc/handle.ts";

test("ipc sender must be the renderer origin", () => {
  expect(() => assertSender("https://evil.example/")).toThrow("untrusted ipc sender");
  expect(() => assertSender(undefined)).toThrow("untrusted ipc sender");
  expect(() => assertSender("http://127.0.0.1:5173/")).toThrow("untrusted ipc sender");
  expect(() => assertSender("app://bundle/")).not.toThrow();
  expect(() => assertSender("app://bundle/settings")).not.toThrow();
});

test("openExternal allows http and mailto, rejects the rest", () => {
  expect(parseExternalUrl("https://example.com")).toBe("https://example.com");
  expect(parseExternalUrl("mailto:dev@example.com")).toBe("mailto:dev@example.com");
  expect(() => parseExternalUrl("javascript:alert(1)")).toThrow("blocked external url");
  expect(() => parseExternalUrl("file:///etc/passwd")).toThrow("blocked external url");
});

test("clipboard write rejects oversized text", () => {
  expect(() => parseClipboardText("x".repeat(1_048_577))).toThrow();
});

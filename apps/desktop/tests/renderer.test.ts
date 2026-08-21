import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { productionRendererUrl } from "@v-monorepo/shared/electron";
import { expect, test } from "vite-plus/test";
import {
  defaultApiOrigin,
  isApiPathname,
  parseRendererUrl,
  requireLoopbackOrigin,
  resolveHttpOrigin,
  resolveRendererFileFromRequest,
  rewriteToOrigin,
} from "@/main/renderer-route.ts";
import { isTrustedRendererUrl } from "@/main/urls.ts";

const rendererRoot = mkdtempSync(join(tmpdir(), "v-desktop-renderer-"));
writeFileSync(join(rendererRoot, "index.html"), "<html></html>");
mkdirSync(join(rendererRoot, "assets"));
writeFileSync(join(rendererRoot, "assets/app.js"), "console.log(1)");

test("API paths rewrite onto the API origin", () => {
  expect(isApiPathname("/api")).toBe(true);
  expect(isApiPathname("/api/health")).toBe(true);
  expect(isApiPathname("/api-token")).toBe(false);

  const health = parseRendererUrl("app://bundle/api/health?ready=1");
  if (health === undefined) {
    throw new Error("expected renderer url");
  }
  expect(rewriteToOrigin(health, defaultApiOrigin)).toBe(
    "http://127.0.0.1:3001/api/health?ready=1",
  );
  expect(parseRendererUrl("https://evil.example/api/health")).toBe(undefined);
});

test("API_ORIGIN accepts http(s) and rejects the rest", () => {
  expect(resolveHttpOrigin(undefined)).toBe(undefined);
  expect(resolveHttpOrigin("https://api.example.com/ignored")).toBe("https://api.example.com");
  expect(resolveHttpOrigin("not-a-url")).toBe(undefined);
  expect(resolveHttpOrigin("file:///tmp")).toBe(undefined);
});

test("Vite origin must be loopback http(s)", () => {
  expect(requireLoopbackOrigin(undefined)).toBe(undefined);
  expect(requireLoopbackOrigin("http://127.0.0.1:5173/")).toBe("http://127.0.0.1:5173");
  expect(requireLoopbackOrigin("http://localhost:5173")).toBe("http://localhost:5173");
  expect(requireLoopbackOrigin("http://[::1]:5173")).toBe("http://[::1]:5173");
  expect(() => requireLoopbackOrigin("https://evil.example")).toThrow(
    "invalid ELECTRON_RENDERER_URL",
  );
  expect(() => requireLoopbackOrigin("not-a-url")).toThrow("invalid ELECTRON_RENDERER_URL");
});

test("maps renderer files and rejects traversal", () => {
  expect(resolveRendererFileFromRequest(productionRendererUrl, rendererRoot)).toBe(
    join(rendererRoot, "index.html"),
  );
  expect(resolveRendererFileFromRequest("app://bundle/assets/app.js", rendererRoot)).toBe(
    join(rendererRoot, "assets/app.js"),
  );
  expect(resolveRendererFileFromRequest("app://bundle/settings", rendererRoot)).toBe(
    join(rendererRoot, "index.html"),
  );
  expect(resolveRendererFileFromRequest("app://bundle/assets/missing.js", rendererRoot)).toBe(
    undefined,
  );
  expect(
    resolveRendererFileFromRequest("app://bundle/foo/..%2F..%2F..%2Fetc/passwd", rendererRoot),
  ).toBe(undefined);
  expect(resolveRendererFileFromRequest("file:///etc/passwd", rendererRoot)).toBe(undefined);
});

test("navigation allows only the renderer origin", () => {
  expect(isTrustedRendererUrl("app://bundle/")).toBe(true);
  expect(isTrustedRendererUrl("app://bundle/settings")).toBe(true);
  expect(isTrustedRendererUrl("about:blank")).toBe(true);
  expect(isTrustedRendererUrl("https://evil.example/")).toBe(false);
  expect(isTrustedRendererUrl("http://127.0.0.1:5173/")).toBe(false);
  expect(isTrustedRendererUrl("file:///tmp/index.html")).toBe(false);
});

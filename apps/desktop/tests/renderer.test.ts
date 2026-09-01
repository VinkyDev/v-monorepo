import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { productionRendererUrl } from "@v-monorepo/shared/electron";
import { describe, expect, test } from "vite-plus/test";

import {
  defaultApiOrigin,
  isApiPathname,
  parseRendererUrl,
  requireLoopbackOrigin,
  resolveHttpOrigin,
  resolveRendererFileFromRequest,
  rewriteToOrigin,
} from "#/main/renderer-route.ts";
import { isTrustedRendererUrl } from "#/main/urls.ts";

const rendererRoot = mkdtempSync(path.join(tmpdir(), "v-desktop-renderer-"));
writeFileSync(path.join(rendererRoot, "index.html"), "<html></html>");
mkdirSync(path.join(rendererRoot, "assets"));
writeFileSync(path.join(rendererRoot, "assets/app.js"), "console.log(1)");

describe("renderer routing", () => {
  test("API paths rewrite onto the API origin", () => {
    expect(isApiPathname("/api")).toBeTruthy();
    expect(isApiPathname("/api/health")).toBeTruthy();
    expect(isApiPathname("/api-token")).toBeFalsy();

    const health = parseRendererUrl("app://bundle/api/health?ready=1");
    if (health === undefined) {
      throw new Error("expected renderer url");
    }
    expect(rewriteToOrigin(health, defaultApiOrigin)).toBe(
      "http://127.0.0.1:3001/api/health?ready=1"
    );
    expect(parseRendererUrl("https://evil.example/api/health")).toBeUndefined();
  });

  test("API_ORIGIN accepts http(s) and rejects the rest", () => {
    expect(resolveHttpOrigin()).toBeUndefined();
    expect(resolveHttpOrigin("https://api.example.com/ignored")).toBe(
      "https://api.example.com"
    );
    expect(resolveHttpOrigin("not-a-url")).toBeUndefined();
    expect(resolveHttpOrigin("file:///tmp")).toBeUndefined();
  });

  test("Vite origin accepts loopback http(s)", () => {
    expect(requireLoopbackOrigin()).toBeUndefined();
    expect(requireLoopbackOrigin("http://127.0.0.1:5173/")).toBe(
      "http://127.0.0.1:5173"
    );
    expect(requireLoopbackOrigin("http://localhost:5173")).toBe(
      "http://localhost:5173"
    );
    expect(requireLoopbackOrigin("http://[::1]:5173")).toBe(
      "http://[::1]:5173"
    );
  });

  test("Vite origin rejects non-loopback and invalid URLs", () => {
    expect(() => requireLoopbackOrigin("https://evil.example")).toThrow(
      "invalid ELECTRON_RENDERER_URL"
    );
    expect(() => requireLoopbackOrigin("not-a-url")).toThrow(
      "invalid ELECTRON_RENDERER_URL"
    );
  });

  test("maps renderer files to disk", () => {
    expect(
      resolveRendererFileFromRequest(productionRendererUrl, rendererRoot)
    ).toBe(path.join(rendererRoot, "index.html"));
    expect(
      resolveRendererFileFromRequest("app://bundle/assets/app.js", rendererRoot)
    ).toBe(path.join(rendererRoot, "assets/app.js"));
    expect(
      resolveRendererFileFromRequest("app://bundle/settings", rendererRoot)
    ).toBe(path.join(rendererRoot, "index.html"));
  });

  test("rejects missing files, traversal, and foreign URLs", () => {
    expect(
      resolveRendererFileFromRequest(
        "app://bundle/assets/missing.js",
        rendererRoot
      )
    ).toBeUndefined();
    expect(
      resolveRendererFileFromRequest(
        "app://bundle/foo/..%2F..%2F..%2Fetc/passwd",
        rendererRoot
      )
    ).toBeUndefined();
    expect(
      resolveRendererFileFromRequest("file:///etc/passwd", rendererRoot)
    ).toBeUndefined();
  });

  test("navigation allows the renderer origin", () => {
    expect(isTrustedRendererUrl("app://bundle/")).toBeTruthy();
    expect(isTrustedRendererUrl("app://bundle/settings")).toBeTruthy();
    expect(isTrustedRendererUrl("about:blank")).toBeTruthy();
  });

  test("navigation rejects untrusted origins", () => {
    expect(isTrustedRendererUrl("https://evil.example/")).toBeFalsy();
    expect(isTrustedRendererUrl("http://127.0.0.1:5173/")).toBeFalsy();
    expect(isTrustedRendererUrl("file:///tmp/index.html")).toBeFalsy();
  });
});

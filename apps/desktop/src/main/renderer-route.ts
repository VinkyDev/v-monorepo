import { isAbsolute, join, relative, resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { rendererHost, rendererProtocol } from "@v-monorepo/shared/electron";

export const defaultApiOrigin = "http://127.0.0.1:3001";

export function isApiPathname(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function resolveHttpOrigin(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return undefined;
  }
  return parsed.origin;
}

function parseLoopbackOrigin(value: string | undefined): string | undefined {
  const origin = resolveHttpOrigin(value);
  if (origin === undefined) {
    return undefined;
  }
  const hostname = new URL(origin).hostname;
  if (
    hostname !== "127.0.0.1" &&
    hostname !== "localhost" &&
    hostname !== "::1" &&
    hostname !== "[::1]"
  ) {
    return undefined;
  }
  return origin;
}

export function requireLoopbackOrigin(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const origin = parseLoopbackOrigin(value);
  if (origin === undefined) {
    throw new Error("invalid ELECTRON_RENDERER_URL");
  }
  return origin;
}

export function parseRendererUrl(requestUrl: string): URL | undefined {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== rendererProtocol || url.hostname !== rendererHost) {
    return undefined;
  }
  return url;
}

export function rewriteToOrigin(url: URL, origin: string): string {
  return new URL(`${url.pathname}${url.search}`, origin).href;
}

export function resolveRendererFileFromRequest(
  requestUrl: string,
  rendererRoot: string,
): string | undefined {
  const url = parseRendererUrl(requestUrl);
  if (url === undefined) {
    return undefined;
  }
  return resolveRendererFile(url, rendererRoot);
}

function resolveRendererFile(url: URL, rendererRoot: string): string | undefined {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  if (pathname.includes("\0")) {
    return undefined;
  }

  const trimmed = pathname.replace(/^\/+/u, "").replace(/\/+$/u, "");
  const relativePath = trimmed === "" ? "index.html" : trimmed;
  const mapped = resolve(rendererRoot, relativePath);
  if (!isPathInside(rendererRoot, mapped)) {
    return undefined;
  }
  if (isExistingFile(mapped)) {
    return mapped;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  const fallback = join(rendererRoot, "index.html");
  if ((lastSegment === "" || !lastSegment.includes(".")) && isExistingFile(fallback)) {
    return fallback;
  }
  return undefined;
}

function isPathInside(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate));
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

function isExistingFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { rendererHost, rendererProtocol } from "@v-monorepo/shared/electron";

export const defaultApiOrigin = "http://127.0.0.1:3001";

export const isApiPathname = (pathname: string): boolean =>
  pathname === "/api" || pathname.startsWith("/api/");

export const resolveHttpOrigin = (value?: string): string | undefined => {
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
};

const parseLoopbackOrigin = (value: string | undefined): string | undefined => {
  const origin = resolveHttpOrigin(value);
  if (origin === undefined) {
    return undefined;
  }
  const { hostname } = new URL(origin);
  if (
    hostname !== "127.0.0.1" &&
    hostname !== "localhost" &&
    hostname !== "::1" &&
    hostname !== "[::1]"
  ) {
    return undefined;
  }
  return origin;
};

export const requireLoopbackOrigin = (value?: string): string | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }
  const origin = parseLoopbackOrigin(value);
  if (origin === undefined) {
    throw new Error("invalid ELECTRON_RENDERER_URL");
  }
  return origin;
};

export const parseRendererUrl = (requestUrl: string): URL | undefined => {
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
};

export const rewriteToOrigin = (url: URL, origin: string): string =>
  new URL(`${url.pathname}${url.search}`, origin).href;

const isPathInside = (root: string, candidate: string): boolean => {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
};

const isExistingFile = (filePath: string): boolean =>
  existsSync(filePath) && statSync(filePath).isFile();

const resolveRendererFile = (
  url: URL,
  rendererRoot: string
): string | undefined => {
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
  const mapped = path.resolve(rendererRoot, relativePath);
  if (!isPathInside(rendererRoot, mapped)) {
    return undefined;
  }
  if (isExistingFile(mapped)) {
    return mapped;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  const fallback = path.join(rendererRoot, "index.html");
  if (
    (lastSegment === "" || !lastSegment.includes(".")) &&
    isExistingFile(fallback)
  ) {
    return fallback;
  }
  return undefined;
};

export const resolveRendererFileFromRequest = (
  requestUrl: string,
  rendererRoot: string
): string | undefined => {
  const url = parseRendererUrl(requestUrl);
  if (url === undefined) {
    return undefined;
  }
  return resolveRendererFile(url, rendererRoot);
};

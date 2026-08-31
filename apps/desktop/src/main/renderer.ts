import { net, protocol } from "electron";
import { pathToFileURL } from "node:url";
import { createLogger } from "@v-monorepo/logger";
import { rendererScheme } from "@v-monorepo/shared/electron";
import {
  defaultApiOrigin,
  isApiPathname,
  parseRendererUrl,
  requireLoopbackOrigin,
  resolveHttpOrigin,
  resolveRendererFileFromRequest,
  rewriteToOrigin,
} from "#/main/renderer-route.ts";

const log = createLogger({ name: "desktop" });

type ProxyInit = RequestInit & { duplex?: "half" };

function requireApiOrigin(value: string | undefined): string {
  if (value === undefined || value === "") {
    return defaultApiOrigin;
  }
  const origin = resolveHttpOrigin(value);
  if (origin === undefined) {
    throw new Error("invalid API_ORIGIN");
  }
  return origin;
}

function proxyInit(request: Request, headers: Headers): ProxyInit {
  const init: ProxyInit = {
    headers,
    method: request.method,
  };
  if (request.method !== "GET" && request.method !== "HEAD" && request.body !== null) {
    init.body = request.body;
    init.duplex = "half";
  }
  return init;
}

export function registerRendererScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: rendererScheme,
      privileges: {
        allowServiceWorkers: true,
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

export function serveRenderer(options: {
  rendererRoot: string;
  apiOrigin?: string;
  viteOrigin?: string;
}): void {
  const apiOrigin = requireApiOrigin(options.apiOrigin);
  const viteOrigin = requireLoopbackOrigin(options.viteOrigin);

  protocol.handle(rendererScheme, async (request) => {
    const url = parseRendererUrl(request.url);
    if (url === undefined) {
      return new Response("Not Found", { status: 404 });
    }

    if (isApiPathname(url.pathname)) {
      return proxyApi(request, rewriteToOrigin(url, apiOrigin));
    }
    if (viteOrigin !== undefined) {
      return proxyVite(request, rewriteToOrigin(url, viteOrigin));
    }

    const filePath = resolveRendererFileFromRequest(request.url, options.rendererRoot);
    if (filePath === undefined) {
      return new Response("Not Found", { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
}

async function proxyApi(request: Request, target: string): Promise<Response> {
  try {
    return await net.fetch(target, proxyInit(request, new Headers(request.headers)));
  } catch (error) {
    log.error(`api proxy failed: ${target}`, error);
    return new Response("Bad Gateway", { status: 502 });
  }
}

async function proxyVite(request: Request, target: string): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete("host");
  try {
    return await fetch(target, proxyInit(request, headers));
  } catch (error) {
    log.error(`vite proxy failed: ${target}`, error);
    return new Response("Vite Dev Server Unavailable", { status: 502 });
  }
}

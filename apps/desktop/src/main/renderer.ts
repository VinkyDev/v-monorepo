import { pathToFileURL } from "node:url";

import { rendererScheme } from "@v-monorepo/electron";
import { logger, toError } from "@v-monorepo/logger";
import { ApiError } from "@v-monorepo/shared";
import type { ErrorCode } from "@v-monorepo/shared";
import { net, protocol } from "electron";

import {
  defaultAgentsOrigin,
  defaultApiOrigin,
  isAgentsPathname,
  isApiPathname,
  isMastraMemoryPathname,
  parseRendererUrl,
  requireLoopbackOrigin,
  resolveHttpOrigin,
  resolveRendererFileFromRequest,
  rewriteToOrigin,
} from "#/main/renderer-route.ts";

const log = logger.child({ scope: "desktop" });

type ProxyInit = RequestInit & { duplex?: "half" };

/** renderer 按服务端响应的方式解析它，shell 保持透明。 */
const errorResponse = (code: ErrorCode): Response => {
  const error = new ApiError(code);
  return Response.json(error.toBody(), { status: error.status });
};

const requireOrigin = (
  value: string | undefined,
  fallback: string,
  envName: string
): string => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const origin = resolveHttpOrigin(value);
  if (origin === undefined) {
    throw new Error(`invalid ${envName}`);
  }
  return origin;
};

const proxyInit = (request: Request, headers: Headers): ProxyInit => {
  const init: ProxyInit = {
    headers,
    method: request.method,
  };
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.body !== null
  ) {
    init.body = request.body;
    init.duplex = "half";
  }
  return init;
};

const proxyApi = async (
  request: Request,
  target: string
): Promise<Response> => {
  try {
    return await net.fetch(
      target,
      proxyInit(request, new Headers(request.headers))
    );
  } catch (error) {
    log.error({
      error: toError(error),
      event: "api_proxy_failed",
      message: `api proxy failed: ${target}`,
    });
    return errorResponse("unavailable");
  }
};

const proxyVite = async (
  request: Request,
  target: string
): Promise<Response> => {
  const headers = new Headers(request.headers);
  headers.delete("host");
  try {
    return await fetch(target, proxyInit(request, headers));
  } catch (error) {
    log.error({
      error: toError(error),
      event: "vite_proxy_failed",
      message: `vite proxy failed: ${target}`,
    });
    return errorResponse("unavailable");
  }
};

export const registerRendererScheme = (): void => {
  protocol.registerSchemesAsPrivileged([
    {
      privileges: {
        allowServiceWorkers: true,
        corsEnabled: true,
        secure: true,
        standard: true,
        stream: true,
        supportFetchAPI: true,
      },
      scheme: rendererScheme,
    },
  ]);
};

export const serveRenderer = (options: {
  agentsOrigin?: string;
  apiOrigin?: string;
  rendererRoot: string;
  viteOrigin?: string;
}): void => {
  const agentsOrigin = requireOrigin(
    options.agentsOrigin,
    defaultAgentsOrigin,
    "AGENTS_ORIGIN"
  );
  const apiOrigin = requireOrigin(
    options.apiOrigin,
    defaultApiOrigin,
    "API_ORIGIN"
  );
  const viteOrigin = requireLoopbackOrigin(options.viteOrigin);

  protocol.handle(rendererScheme, async (request) => {
    const url = parseRendererUrl(request.url);
    if (url === undefined) {
      return errorResponse("not_found");
    }

    if (
      isMastraMemoryPathname(url.pathname) ||
      isAgentsPathname(url.pathname)
    ) {
      return await proxyApi(request, rewriteToOrigin(url, agentsOrigin));
    }
    if (isApiPathname(url.pathname)) {
      return await proxyApi(request, rewriteToOrigin(url, apiOrigin));
    }
    if (viteOrigin !== undefined) {
      return await proxyVite(request, rewriteToOrigin(url, viteOrigin));
    }

    const filePath = resolveRendererFileFromRequest(
      request.url,
      options.rendererRoot
    );
    if (filePath === undefined) {
      return errorResponse("not_found");
    }
    return await net.fetch(pathToFileURL(filePath).href);
  });
};

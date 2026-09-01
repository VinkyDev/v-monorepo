import type { Session } from "electron";

type ElectronResponseHeaders = Record<string, string[]>;

const withResponseHeader = (
  headers: ElectronResponseHeaders,
  name: string,
  value: string | string[]
): ElectronResponseHeaders => {
  const next = Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => key.toLowerCase() !== name.toLowerCase()
    )
  );
  next[name] = Array.isArray(value) ? value : [value];
  return next;
};

export const setupCorsBypass = (session: Session): void => {
  const originMap = new Map<number, string>();

  session.webRequest.onBeforeSendHeaders((details, respond) => {
    const requestHeaders = { ...details.requestHeaders };
    if (requestHeaders.Origin !== undefined) {
      originMap.set(details.id, requestHeaders.Origin);
      delete requestHeaders.Origin;
    }
    respond({ requestHeaders });
  });

  session.webRequest.onHeadersReceived((details, respond) => {
    let responseHeaders = details.responseHeaders ?? {};
    const origin = originMap.get(details.id) ?? "*";

    responseHeaders = withResponseHeader(
      responseHeaders,
      "Access-Control-Allow-Origin",
      origin
    );
    responseHeaders = withResponseHeader(
      responseHeaders,
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    responseHeaders = withResponseHeader(
      responseHeaders,
      "Access-Control-Allow-Headers",
      "*"
    );
    responseHeaders = withResponseHeader(
      responseHeaders,
      "Access-Control-Allow-Credentials",
      "true"
    );

    originMap.delete(details.id);

    if (details.method === "OPTIONS") {
      responseHeaders = withResponseHeader(
        responseHeaders,
        "Access-Control-Max-Age",
        "86400"
      );
      respond({ responseHeaders, statusLine: "HTTP/1.1 200 OK" });
      return;
    }

    respond({ responseHeaders });
  });
};

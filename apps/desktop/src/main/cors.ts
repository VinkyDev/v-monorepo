import type { Session } from "electron";

type ElectronResponseHeaders = Record<string, string[]>;

function setResponseHeader(
  headers: ElectronResponseHeaders,
  name: string,
  value: string | string[],
): void {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) {
      delete headers[key];
    }
  }
  headers[name] = Array.isArray(value) ? value : [value];
}

export function setupCorsBypass(session: Session): void {
  const originMap = new Map<number, string>();

  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    if (requestHeaders.Origin !== undefined) {
      originMap.set(details.id, requestHeaders.Origin);
      delete requestHeaders.Origin;
    }
    callback({ requestHeaders });
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders ?? {};
    const origin = originMap.get(details.id) ?? "*";

    setResponseHeader(responseHeaders, "Access-Control-Allow-Origin", origin);
    setResponseHeader(
      responseHeaders,
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    setResponseHeader(responseHeaders, "Access-Control-Allow-Headers", "*");
    setResponseHeader(responseHeaders, "Access-Control-Allow-Credentials", "true");

    originMap.delete(details.id);

    if (details.method === "OPTIONS") {
      setResponseHeader(responseHeaders, "Access-Control-Max-Age", "86400");
      callback({ responseHeaders, statusLine: "HTTP/1.1 200 OK" });
      return;
    }

    callback({ responseHeaders });
  });
}

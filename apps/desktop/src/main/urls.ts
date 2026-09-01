import { rendererHost, rendererProtocol } from "@v-monorepo/shared/electron";

export const isTrustedRendererUrl = (frameUrl: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(frameUrl);
  } catch {
    return false;
  }

  if (
    parsed.protocol === rendererProtocol &&
    parsed.hostname === rendererHost
  ) {
    return true;
  }
  return parsed.protocol === "about:" && parsed.pathname === "blank";
};

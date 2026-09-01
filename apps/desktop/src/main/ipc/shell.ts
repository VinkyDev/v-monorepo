import { shellCapabilities } from "@v-monorepo/shared/electron";
import { clipboard, shell } from "electron";
import { z } from "zod";

import { handle } from "#/main/ipc/handle.ts";

const clipboardTextSchema = z.string().max(1_048_576);
const ipcUrlSchema = z.string().min(1);
const allowedExternalProtocols = new Set(["http:", "https:", "mailto:"]);

const electronVersion = (): string => {
  const version = process.versions.electron;
  if (version === undefined || version === "") {
    throw new Error("electron version is unavailable");
  }
  return version;
};

const isAllowedExternalUrl = (value: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return allowedExternalProtocols.has(parsed.protocol);
};

export const parseExternalUrl = (url: string): string => {
  const parsed = ipcUrlSchema.parse(url);
  if (!isAllowedExternalUrl(parsed)) {
    throw new Error("blocked external url");
  }
  return parsed;
};

const openExternal = async (url: string): Promise<void> => {
  await shell.openExternal(parseExternalUrl(url));
};

export const parseClipboardText = (text: string): string =>
  clipboardTextSchema.parse(text);

export const setupShellHandlers = (): void => {
  handle(shellCapabilities.getElectronVersion.channel, () => electronVersion());
  handle(shellCapabilities.openExternal.channel, async (_event, url) => {
    await openExternal(url);
  });
  handle(
    shellCapabilities.readClipboardText.channel,
    async () => await clipboard.readText()
  );
  handle(shellCapabilities.writeClipboardText.channel, async (_event, text) => {
    await clipboard.writeText(parseClipboardText(text));
  });
};

import { clipboard, shell } from "electron";
import { z } from "zod";
import { shellCapabilities } from "@v-monorepo/shared/electron";
import { handle } from "#/main/ipc/handle.ts";

const clipboardTextSchema = z.string().max(1_048_576);
const ipcUrlSchema = z.string().min(1);
const allowedExternalProtocols = new Set(["http:", "https:", "mailto:"]);

export function setupShellHandlers(): void {
  handle(shellCapabilities.getElectronVersion.channel, () => electronVersion());
  handle(shellCapabilities.openExternal.channel, (_event, url) => openExternal(url));
  handle(shellCapabilities.readClipboardText.channel, () => clipboard.readText());
  handle(shellCapabilities.writeClipboardText.channel, async (_event, text) => {
    await clipboard.writeText(parseClipboardText(text));
  });
}

export function parseClipboardText(text: string): string {
  return clipboardTextSchema.parse(text);
}

export function parseExternalUrl(url: string): string {
  const parsed = ipcUrlSchema.parse(url);
  if (!isAllowedExternalUrl(parsed)) {
    throw new Error("blocked external url");
  }
  return parsed;
}

function electronVersion(): string {
  const version = process.versions.electron;
  if (version === undefined || version === "") {
    throw new Error("electron version is unavailable");
  }
  return version;
}

async function openExternal(url: string): Promise<void> {
  await shell.openExternal(parseExternalUrl(url));
}

function isAllowedExternalUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return allowedExternalProtocols.has(parsed.protocol);
}

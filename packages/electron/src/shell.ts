import type { IpcResult } from "./ipc.ts";

export const shellCapabilities = {
  getElectronVersion: { channel: "app:electronVersion" },
  openExternal: { channel: "app:openExternal" },
  readClipboardText: { channel: "app:clipboardReadText" },
  writeClipboardText: { channel: "app:clipboardWriteText" },
} as const;

export type ShellCapabilityName = keyof typeof shellCapabilities;

export interface ShellCapability {
  getElectronVersion: {
    channel: (typeof shellCapabilities)["getElectronVersion"]["channel"];
    args: [];
    result: string;
  };
  openExternal: {
    channel: (typeof shellCapabilities)["openExternal"]["channel"];
    args: [url: string];
    result: undefined;
  };
  readClipboardText: {
    channel: (typeof shellCapabilities)["readClipboardText"]["channel"];
    args: [];
    result: string;
  };
  writeClipboardText: {
    channel: (typeof shellCapabilities)["writeClipboardText"]["channel"];
    args: [text: string];
    result: undefined;
  };
}

/** What preload exposes: every call resolves, success or failure. */
export type ShellBridge = {
  [K in ShellCapabilityName]: (
    ...args: ShellCapability[K]["args"]
  ) => Promise<IpcResult<ShellCapability[K]["result"]>>;
};

/** What pages call: failures throw an `ApiError`, like any other request. */
export type ShellApi = {
  [K in ShellCapabilityName]: (
    ...args: ShellCapability[K]["args"]
  ) => Promise<ShellCapability[K]["result"]>;
};

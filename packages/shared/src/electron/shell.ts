export const shellCapabilities = {
  getElectronVersion: { channel: "app:electronVersion" },
  openExternal: { channel: "app:openExternal" },
  readClipboardText: { channel: "app:clipboardReadText" },
  writeClipboardText: { channel: "app:clipboardWriteText" },
} as const;

export type ShellCapabilityName = keyof typeof shellCapabilities;

export type ShellCapability = {
  getElectronVersion: {
    channel: (typeof shellCapabilities)["getElectronVersion"]["channel"];
    args: [];
    result: string;
  };
  openExternal: {
    channel: (typeof shellCapabilities)["openExternal"]["channel"];
    args: [url: string];
    result: void;
  };
  readClipboardText: {
    channel: (typeof shellCapabilities)["readClipboardText"]["channel"];
    args: [];
    result: string;
  };
  writeClipboardText: {
    channel: (typeof shellCapabilities)["writeClipboardText"]["channel"];
    args: [text: string];
    result: void;
  };
};

export type ShellApi = {
  [K in ShellCapabilityName]: (
    ...args: ShellCapability[K]["args"]
  ) => Promise<ShellCapability[K]["result"]>;
};

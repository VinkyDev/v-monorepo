import { setupShellHandlers } from "#/main/ipc/shell.ts";

export const ipcInit = (): void => {
  setupShellHandlers();
};

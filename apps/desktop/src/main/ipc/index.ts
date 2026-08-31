import { setupShellHandlers } from "#/main/ipc/shell.ts";

export function ipcInit(): void {
  setupShellHandlers();
}

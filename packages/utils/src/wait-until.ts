import { delay } from "es-toolkit";

export interface WaitUntilOptions {
  intervalMs: number;
  message?: string;
  timeoutMs: number;
}

export const waitUntil = async (
  check: () => boolean | Promise<boolean>,
  options: WaitUntilOptions
): Promise<void> => {
  const deadline = Date.now() + options.timeoutMs;

  const poll = async (): Promise<void> => {
    if (await check()) {
      return;
    }
    if (Date.now() >= deadline) {
      throw new Error(options.message ?? "timed out");
    }
    await delay(options.intervalMs);
    await poll();
  };

  await poll();
};

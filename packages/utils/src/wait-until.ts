import { delay } from "es-toolkit";

export interface WaitUntilOptions {
  /** 每次轮询的间隔时间（毫秒）。 */
  intervalMs: number;
  /** 超时后抛出的错误信息，默认为 `"timed out"`。 */
  message?: string;
  /** 从调用时开始计算的超时时间（毫秒）。 */
  timeoutMs: number;
}

/**
 * 轮询检查函数，直到返回 `true` 或超时。
 *
 * @param check - 检查函数
 * @param options - 轮询配置
 * @returns 检查通过后 resolve
 * @throws {Error} 超过 `timeoutMs` 仍未通过，信息为 `options.message` 或 `"timed out"`
 */
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

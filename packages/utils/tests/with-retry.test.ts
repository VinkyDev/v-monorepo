import { describe, expect, test } from "vite-plus/test";

import { withRetry } from "#/index.ts";

const loadOk = async (): Promise<string> => await Promise.resolve("ok");

describe(withRetry, () => {
  test("returns the first successful run", async () => {
    await expect(withRetry(loadOk, { retries: 2 })()).resolves.toBe("ok");
  });

  test("retries after failure then succeeds", async () => {
    let attempts = 0;
    const loadFlaky = async (): Promise<string> => {
      attempts += 1;
      if (attempts < 3) {
        return await Promise.reject(new Error("chunk missing"));
      }
      return await Promise.resolve("ok");
    };

    await expect(withRetry(loadFlaky, { retries: 2 })()).resolves.toBe("ok");
    expect(attempts).toBe(3);
  });

  test("throws the last error after retries are exhausted", async () => {
    let attempts = 0;
    const failure = new Error("still missing");
    const loadFail = async (): Promise<string> => {
      attempts += 1;
      return await Promise.reject(failure);
    };

    await expect(withRetry(loadFail, { retries: 2 })()).rejects.toBe(failure);
    expect(attempts).toBe(3);
  });
});

import { describe, expect, test } from "vite-plus/test";

import { waitUntil } from "#/index.ts";

describe(waitUntil, () => {
  test("returns immediately when the check already passes", async () => {
    await expect(
      waitUntil(() => true, { intervalMs: 20, timeoutMs: 50 })
    ).resolves.toBeUndefined();
  });

  test("returns after a later check passes", async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 30);

    await waitUntil(() => ready, { intervalMs: 10, timeoutMs: 200 });
    expect(ready).toBeTruthy();
  });

  test("throws the given message when the deadline is reached", async () => {
    await expect(
      waitUntil(() => false, {
        intervalMs: 10,
        message: "never ready",
        timeoutMs: 40,
      })
    ).rejects.toThrow("never ready");
  });
});

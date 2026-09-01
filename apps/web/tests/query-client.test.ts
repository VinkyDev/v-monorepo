import { AppError } from "@v-monorepo/shared";
import { describe, expect, test } from "vite-plus/test";

import { createQueryClient } from "#/lib/query-client.ts";

describe(createQueryClient, () => {
  test("does not retry 4xx AppError", async () => {
    const queryClient = createQueryClient();
    let attempts = 0;

    await expect(
      queryClient.query({
        queryFn: () => {
          attempts += 1;
          throw new AppError("NOT_FOUND");
        },
        queryKey: ["no-retry"],
        retryDelay: 0,
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(attempts).toBe(1);
  });

  test("retries 5xx AppError three times", async () => {
    const queryClient = createQueryClient();
    let attempts = 0;

    await expect(
      queryClient.query({
        queryFn: () => {
          attempts += 1;
          throw new AppError("INTERNAL_ERROR");
        },
        queryKey: ["retry"],
        retryDelay: 0,
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(attempts).toBe(4);
  });
});

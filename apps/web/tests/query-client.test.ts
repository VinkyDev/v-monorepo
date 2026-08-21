import { expect, test } from "vite-plus/test";
import { AppError } from "@v-monorepo/shared";
import { createQueryClient } from "@/lib/query-client.ts";

test("does not retry 4xx AppError", async () => {
  const queryClient = createQueryClient();
  let attempts = 0;

  await expect(
    queryClient.fetchQuery({
      queryKey: ["no-retry"],
      queryFn: () => {
        attempts += 1;
        throw new AppError("NOT_FOUND");
      },
      retryDelay: 0,
    }),
  ).rejects.toBeInstanceOf(AppError);

  expect(attempts).toBe(1);
});

test("retries 5xx AppError three times", async () => {
  const queryClient = createQueryClient();
  let attempts = 0;

  await expect(
    queryClient.fetchQuery({
      queryKey: ["retry"],
      queryFn: () => {
        attempts += 1;
        throw new AppError("INTERNAL_ERROR");
      },
      retryDelay: 0,
    }),
  ).rejects.toBeInstanceOf(AppError);

  expect(attempts).toBe(4);
});

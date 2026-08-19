import { MutationObserver } from "@tanstack/react-query";
import { expect, test } from "vite-plus/test";
import { AppError, errorCatalog } from "@v-monorepo/shared";
import { createQueryClient } from "@/lib/query-client.ts";

function queryClientWithNotices() {
  const notices: { title: string; description: string | undefined }[] = [];
  const queryClient = createQueryClient((title, description) => {
    notices.push({ title, description });
  });
  return { notices, queryClient };
}

test("toasts title only when it matches the AppError message", async () => {
  const { notices, queryClient } = queryClientWithNotices();

  await expect(
    queryClient.fetchQuery({
      queryKey: ["bad-request"],
      queryFn: () => {
        throw new AppError("BAD_REQUEST");
      },
      retry: false,
    }),
  ).rejects.toBeInstanceOf(AppError);

  expect(notices).toEqual([{ title: errorCatalog.BAD_REQUEST.title, description: undefined }]);
});

test("toasts title and description when the message is more specific", async () => {
  const { notices, queryClient } = queryClientWithNotices();

  await expect(
    queryClient.fetchQuery({
      queryKey: ["not-found"],
      queryFn: () => {
        throw new AppError("NOT_FOUND", { message: "Widget not found" });
      },
      retry: false,
    }),
  ).rejects.toBeInstanceOf(AppError);

  expect(notices).toEqual([
    { title: errorCatalog.NOT_FOUND.title, description: "Widget not found" },
  ]);
});

test("unknown failures toast the catalog INTERNAL_ERROR copy", async () => {
  const { notices, queryClient } = queryClientWithNotices();

  await expect(
    queryClient.fetchQuery({
      queryKey: ["unknown"],
      queryFn: () => {
        throw new Error("network down");
      },
      retry: false,
    }),
  ).rejects.toThrow("network down");

  expect(notices).toEqual([
    { title: errorCatalog.INTERNAL_ERROR.title, description: errorCatalog.INTERNAL_ERROR.detail },
  ]);
});

test("does not retry 4xx AppError", async () => {
  const { queryClient } = queryClientWithNotices();
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
  const { queryClient } = queryClientWithNotices();
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

test("mutations toast after failure", async () => {
  const { notices, queryClient } = queryClientWithNotices();
  const observer = new MutationObserver(queryClient, {
    mutationFn: async () => {
      throw new AppError("NOT_FOUND", { message: "Widget not found" });
    },
  });

  await expect(observer.mutate()).rejects.toBeInstanceOf(AppError);
  expect(notices).toEqual([
    { title: errorCatalog.NOT_FOUND.title, description: "Widget not found" },
  ]);
});

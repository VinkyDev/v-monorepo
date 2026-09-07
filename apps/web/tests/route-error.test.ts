import { AppError, errorCatalog } from "@v-monorepo/shared";
import { describe, expect, test } from "vite-plus/test";

import { routeErrorView } from "#/lib/route-error.ts";

describe(routeErrorView, () => {
  test("keeps AppError catalog title and detail", () => {
    expect(routeErrorView(new AppError("NOT_FOUND"))).toStrictEqual({
      detail: errorCatalog.NOT_FOUND.detail,
      requestId: undefined,
      title: errorCatalog.NOT_FOUND.title,
    });
  });

  test("omits detail when it duplicates the title", () => {
    expect(routeErrorView(new AppError("BAD_REQUEST")).detail).toBeUndefined();
  });

  test("wraps unknown errors as INTERNAL_ERROR without leaking the message", () => {
    expect(routeErrorView(new Error("secret internals"))).toStrictEqual({
      detail: errorCatalog.INTERNAL_ERROR.detail,
      requestId: undefined,
      title: errorCatalog.INTERNAL_ERROR.title,
    });
  });

  test("keeps the request id from AppError", () => {
    const requestId = "11111111-1111-4111-8111-111111111111";
    expect(
      routeErrorView(new AppError("TIMEOUT", { requestId })).requestId
    ).toBe(requestId);
  });
});

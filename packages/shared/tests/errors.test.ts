import { describe, expect, test } from "vite-plus/test";

import { createRequestId } from "#/http.ts";
import {
  AppError,
  errorCatalog,
  PROBLEM_CONTENT_TYPE,
  REQUEST_ID_HEADER,
} from "#/index.ts";

describe(AppError, () => {
  test("AppError serializes RFC 9457 fields from the catalog", async () => {
    const requestId = createRequestId();
    const response = new AppError("NOT_FOUND").toResponse(requestId);
    const problem: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(requestId);
    expect(problem).toStrictEqual({
      code: "NOT_FOUND",
      detail: errorCatalog.NOT_FOUND.detail,
      instance: `urn:uuid:${requestId}`,
      status: 404,
      title: errorCatalog.NOT_FOUND.title,
      type: "https://httpproblems.com/http-status/404",
    });
  });

  test("AppError can override the catalog message, including 5xx", async () => {
    const notFound: unknown = await new AppError("NOT_FOUND", {
      message: "Widget not found",
    })
      .toResponse()
      .json();
    expect(notFound).toMatchObject({ detail: "Widget not found" });

    const internal = new AppError("INTERNAL_ERROR", {
      message: "数据库迁移中",
    });
    expect(internal.message).toBe("数据库迁移中");
    const internalProblem: unknown = await internal.toResponse().json();
    expect(internalProblem).toMatchObject({ detail: "数据库迁移中" });
  });

  test("validation problems keep field errors", async () => {
    const problem: unknown = await new AppError("VALIDATION_ERROR", {
      errors: [{ name: "name", pointer: "/name", reason: "Too small" }],
    })
      .toResponse()
      .json();

    expect(problem).toMatchObject({
      code: "VALIDATION_ERROR",
      errors: [{ name: "name", pointer: "/name", reason: "Too small" }],
    });
  });

  test("fromResponse round-trips a problem body and request id", async () => {
    const requestId = createRequestId();
    const error = await AppError.fromResponse(
      new AppError("NOT_FOUND").toResponse(requestId)
    );
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.requestId).toBe(requestId);
  });

  test("fromResponse recovers a request id from the instance urn", async () => {
    const requestId = createRequestId();
    const error = await AppError.fromResponse(
      Response.json(
        {
          code: "NOT_FOUND",
          detail: errorCatalog.NOT_FOUND.detail,
          instance: `urn:uuid:${requestId}`,
          status: 404,
          title: errorCatalog.NOT_FOUND.title,
          type: "https://httpproblems.com/http-status/404",
        },
        { headers: { "Content-Type": PROBLEM_CONTENT_TYPE }, status: 404 }
      )
    );
    expect(error.requestId).toBe(requestId);
  });

  test("fromResponse maps ad-hoc envelopes without leaking 5xx bodies", async () => {
    const requestId = createRequestId();
    const notFound = await AppError.fromResponse(
      Response.json(
        { error: "Not Found" },
        { headers: { "Content-Type": "application/json" }, status: 404 }
      )
    );
    expect(notFound.code).toBe("NOT_FOUND");
    expect(notFound.message).toBe(errorCatalog.NOT_FOUND.detail);

    const internal = await AppError.fromResponse(
      new Response("secret", {
        headers: { [REQUEST_ID_HEADER]: requestId },
        status: 500,
      })
    );
    expect(internal.code).toBe("INTERNAL_ERROR");
    expect(internal.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
    expect(internal.requestId).toBe(requestId);
  });

  test("fromHttpStatus keeps trusted 4xx messages", () => {
    const notFound = AppError.fromHttpStatus(404, {
      message: "Widget not found",
    });
    expect(notFound.code).toBe("NOT_FOUND");
    expect(notFound.message).toBe("Widget not found");
  });

  test("fromHttpStatus hides untrusted 5xx messages", () => {
    const leaked = AppError.fromHttpStatus(500, {
      message: "secret internals",
    });
    expect(leaked.code).toBe("INTERNAL_ERROR");
    expect(leaked.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
  });

  test("fromCause wraps unknown causes as INTERNAL_ERROR", () => {
    const cause = new Error("network down");
    const wrapped = AppError.fromCause(cause);
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
    expect(wrapped.cause).toBe(cause);
    expect(AppError.fromCause(wrapped)).toBe(wrapped);
  });
});

import { expect, test } from "vite-plus/test";
import { AppError, errorCatalog, PROBLEM_CONTENT_TYPE, REQUEST_ID_HEADER } from "@/index.ts";
import { createRequestId } from "@/http.ts";

test("AppError serializes RFC 9457 fields from the catalog", async () => {
  const requestId = createRequestId();
  const response = new AppError("NOT_FOUND").toResponse(requestId);
  const problem = await response.json();

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
  expect(response.headers.get(REQUEST_ID_HEADER)).toBe(requestId);
  expect(problem.type).toBe("https://httpproblems.com/http-status/404");
  expect(problem.title).toBe(errorCatalog.NOT_FOUND.title);
  expect(problem.status).toBe(404);
  expect(problem.code).toBe("NOT_FOUND");
  expect(problem.detail).toBe(errorCatalog.NOT_FOUND.detail);
  expect(problem.instance).toBe(`urn:uuid:${requestId}`);
});

test("AppError can override the catalog message, including 5xx", async () => {
  const notFound = await new AppError("NOT_FOUND", { message: "Widget not found" })
    .toResponse()
    .json();
  expect(notFound.detail).toBe("Widget not found");

  const internal = new AppError("INTERNAL_ERROR", { message: "数据库迁移中" });
  expect(internal.message).toBe("数据库迁移中");
  expect((await internal.toResponse().json()).detail).toBe("数据库迁移中");
});

test("validation problems keep field errors", async () => {
  const problem = await new AppError("VALIDATION_ERROR", {
    errors: [{ name: "name", reason: "Too small", pointer: "/name" }],
  })
    .toResponse()
    .json();

  expect(problem.code).toBe("VALIDATION_ERROR");
  expect(problem.errors).toEqual([{ name: "name", reason: "Too small", pointer: "/name" }]);
});

test("fromResponse round-trips a problem body and request id", async () => {
  const requestId = createRequestId();
  const error = await AppError.fromResponse(new AppError("NOT_FOUND").toResponse(requestId));
  expect(error.code).toBe("NOT_FOUND");
  expect(error.status).toBe(404);
  expect(error.requestId).toBe(requestId);
});

test("fromResponse recovers a request id from the instance urn", async () => {
  const requestId = createRequestId();
  const error = await AppError.fromResponse(
    new Response(
      JSON.stringify({
        type: "https://httpproblems.com/http-status/404",
        title: errorCatalog.NOT_FOUND.title,
        status: 404,
        detail: errorCatalog.NOT_FOUND.detail,
        code: "NOT_FOUND",
        instance: `urn:uuid:${requestId}`,
      }),
      { status: 404, headers: { "Content-Type": PROBLEM_CONTENT_TYPE } },
    ),
  );
  expect(error.requestId).toBe(requestId);
});

test("fromResponse maps ad-hoc envelopes without leaking 5xx bodies", async () => {
  const requestId = createRequestId();
  const notFound = await AppError.fromResponse(
    new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }),
  );
  expect(notFound.code).toBe("NOT_FOUND");
  expect(notFound.message).toBe(errorCatalog.NOT_FOUND.detail);

  const internal = await AppError.fromResponse(
    new Response("secret", {
      status: 500,
      headers: { [REQUEST_ID_HEADER]: requestId },
    }),
  );
  expect(internal.code).toBe("INTERNAL_ERROR");
  expect(internal.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
  expect(internal.requestId).toBe(requestId);
});

test("fromHttpStatus and fromCause hide untrusted 5xx messages", () => {
  const notFound = AppError.fromHttpStatus(404, { message: "Widget not found" });
  expect(notFound.code).toBe("NOT_FOUND");
  expect(notFound.message).toBe("Widget not found");

  const leaked = AppError.fromHttpStatus(500, { message: "secret internals" });
  expect(leaked.code).toBe("INTERNAL_ERROR");
  expect(leaked.message).toBe(errorCatalog.INTERNAL_ERROR.detail);

  const cause = new Error("network down");
  const wrapped = AppError.fromCause(cause);
  expect(wrapped.code).toBe("INTERNAL_ERROR");
  expect(wrapped.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
  expect(wrapped.cause).toBe(cause);
  expect(AppError.fromCause(wrapped)).toBe(wrapped);
});

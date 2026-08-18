import { expect, test } from "vite-plus/test";
import { createRequestId } from "../src/http.ts";
import { AppError, errorCatalog, PROBLEM_CONTENT_TYPE, REQUEST_ID_HEADER } from "../src/index.ts";

async function readProblem(error: AppError, requestId?: string) {
  return error.toResponse(requestId).json();
}

test("AppError fills RFC 9457 fields from the catalog", async () => {
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
  expect(problem.errors).toBeUndefined();
});

test("AppError uses catalog defaults and can override message", async () => {
  const fallback = new AppError("NOT_FOUND");
  expect(fallback.status).toBe(404);
  expect(fallback.title).toBe(errorCatalog.NOT_FOUND.title);
  expect(fallback.message).toBe(errorCatalog.NOT_FOUND.detail);

  const problem = await readProblem(new AppError("NOT_FOUND", { message: "Widget not found" }));
  expect(problem.code).toBe("NOT_FOUND");
  expect(problem.detail).toBe("Widget not found");
});

test("explicit INTERNAL_ERROR message is trusted and serialized", async () => {
  const error = new AppError("INTERNAL_ERROR", { message: "数据库迁移中" });
  expect(error.message).toBe("数据库迁移中");
  const problem = await readProblem(error);
  expect(problem.detail).toBe("数据库迁移中");
});

test("validation problems keep field errors and an explicit code", async () => {
  const problem = await readProblem(
    new AppError("VALIDATION_ERROR", {
      errors: [{ name: "name", reason: "Too small", pointer: "/name" }],
    }),
  );

  expect(problem.code).toBe("VALIDATION_ERROR");
  expect(problem.errors).toEqual([{ name: "name", reason: "Too small", pointer: "/name" }]);
});

test("AppError.fromResponse reads application/problem+json", async () => {
  const response = new AppError("PAYLOAD_TOO_LARGE").toResponse();
  const error = await AppError.fromResponse(response);
  expect(error.code).toBe("PAYLOAD_TOO_LARGE");
  expect(error.status).toBe(413);
  expect(error.message).toBe(errorCatalog.PAYLOAD_TOO_LARGE.detail);
});

test("AppError.fromResponse maps ad-hoc envelopes from status", async () => {
  const error = await AppError.fromResponse(
    new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }),
  );
  expect(error.code).toBe("NOT_FOUND");
  expect(error.message).toBe(errorCatalog.NOT_FOUND.detail);
});

test("AppError.fromResponse does not leak 5xx bodies", async () => {
  const error = await AppError.fromResponse(new Response("secret", { status: 500 }));
  expect(error.code).toBe("INTERNAL_ERROR");
  expect(error.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
});

test("AppError.fromHttpStatus keeps 4xx messages and strips 5xx messages", () => {
  const notFound = AppError.fromHttpStatus(404, { message: "Widget not found" });
  expect(notFound.code).toBe("NOT_FOUND");
  expect(notFound.message).toBe("Widget not found");

  const internal = AppError.fromHttpStatus(500, { message: "secret internals" });
  expect(internal.code).toBe("INTERNAL_ERROR");
  expect(internal.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
});

test("AppError.fromCause wraps unknown failures without leaking the cause message", () => {
  const cause = new Error("network down");
  const wrapped = AppError.fromCause(cause);
  expect(wrapped.code).toBe("INTERNAL_ERROR");
  expect(wrapped.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
  expect(wrapped.cause).toBe(cause);
  expect(AppError.fromCause(wrapped)).toBe(wrapped);
});

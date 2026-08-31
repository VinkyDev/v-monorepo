import { expect, test } from "vite-plus/test";
import { AppError, BODY_LIMIT_BYTES, PROBLEM_CONTENT_TYPE, errorCatalog } from "@v-monorepo/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RequestIdVariables } from "hono/request-id";
import { z } from "zod";
import { createApp } from "#/app.ts";
import { handleAppError } from "#/problem.ts";
import { assignRequestId } from "#/request-id.ts";
import { validateJson } from "#/validate.ts";

type AppEnv = {
  Variables: RequestIdVariables;
};

async function readAppError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  expect(contentType.includes(PROBLEM_CONTENT_TYPE)).toBe(true);
  return AppError.fromResponse(response);
}

test("api responses allow any origin", async () => {
  const response = await createApp().request("/api/health", {
    headers: { Origin: "https://example.com" },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
});

test("unknown routes include a request instance", async () => {
  const response = await createApp().request("/api/missing");
  expect(response.status).toBe(404);
  const body = z.object({ instance: z.string() }).parse(await response.json());
  expect(body.instance.startsWith("urn:uuid:")).toBe(true);
});

test("payload over the body limit returns a 413 problem", async () => {
  const response = await createApp().request("/api/health", {
    method: "POST",
    body: "x".repeat(BODY_LIMIT_BYTES + 1),
  });
  expect(response.status).toBe(413);
  const error = await readAppError(response);
  expect(error.code).toBe("PAYLOAD_TOO_LARGE");
});

test("unhandled errors return a generic 500 problem", async () => {
  const app = new Hono<AppEnv>()
    .use(assignRequestId())
    .get("/boom", () => {
      throw new Error("secret internals");
    })
    .onError(handleAppError);
  const response = await app.request("/boom");
  expect(response.status).toBe(500);
  const error = await readAppError(response);
  expect(error.code).toBe("INTERNAL_ERROR");
  expect(error.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
});

test("HTTPException keeps 4xx messages and hides 5xx messages", async () => {
  const app = new Hono<AppEnv>().use(assignRequestId()).onError(handleAppError);
  app.get("/gone", () => {
    throw new HTTPException(404, { message: "Widget not found" });
  });
  app.get("/boom", () => {
    throw new HTTPException(500, { message: "secret internals" });
  });

  const gone = await readAppError(await app.request("/gone"));
  expect(gone.code).toBe("NOT_FOUND");
  expect(gone.message).toBe("Widget not found");

  const boom = await readAppError(await app.request("/boom"));
  expect(boom.code).toBe("INTERNAL_ERROR");
  expect(boom.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
});

test("json validation failures return field errors", async () => {
  const app = new Hono<AppEnv>()
    .use(assignRequestId())
    .post("/items", validateJson(z.object({ name: z.string().min(1) })), (c) =>
      c.json(c.req.valid("json")),
    )
    .onError(handleAppError);
  const response = await app.request("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "" }),
  });
  expect(response.status).toBe(400);
  const error = await readAppError(response);
  expect(error.code).toBe("VALIDATION_ERROR");
  expect(error.errors !== undefined && error.errors.length > 0).toBe(true);
});

test("thrown AppError serializes catalog code and override message", async () => {
  const app = new Hono<AppEnv>()
    .use(assignRequestId())
    .get("/widget", () => {
      throw new AppError("NOT_FOUND", { message: "Widget not found" });
    })
    .onError(handleAppError);
  const response = await app.request("/widget");
  expect(response.status).toBe(404);
  const error = await readAppError(response);
  expect(error.code).toBe("NOT_FOUND");
  expect(error.message).toBe("Widget not found");
});

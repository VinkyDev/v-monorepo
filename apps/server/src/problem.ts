import { log } from "@v-monorepo/logger";
import { AppError, PROBLEM_CONTENT_TYPE } from "@v-monorepo/shared";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

const isProblemResponse = (response: Response): boolean => {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes(PROBLEM_CONTENT_TYPE);
};

const respond = (c: Context, error: AppError): Response => {
  const response = error.toResponse();
  return c.newResponse(response.body, response);
};

export const handleAppError = (err: Error, c: Context): Response => {
  if (err instanceof AppError) {
    return respond(c, err);
  }
  if (err instanceof HTTPException) {
    const existing = err.getResponse();
    if (isProblemResponse(existing)) {
      return c.newResponse(existing.body, existing);
    }
    return respond(
      c,
      AppError.fromHttpStatus(err.status, { message: err.message })
    );
  }
  log.error("Internal Server Error", err);
  return respond(c, AppError.fromCause(err));
};

export const notFoundProblem = (c: Context): Response =>
  respond(c, new AppError("NOT_FOUND"));

export const payloadTooLargeProblem = (c: Context): Response =>
  respond(c, new AppError("PAYLOAD_TOO_LARGE"));

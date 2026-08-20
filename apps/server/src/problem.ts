import { log } from "@v-monorepo/logger";
import { AppError, PROBLEM_CONTENT_TYPE } from "@v-monorepo/shared";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RequestIdVariables } from "hono/request-id";

type AppEnv = {
  Variables: RequestIdVariables;
};

function isProblemResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes(PROBLEM_CONTENT_TYPE);
}

function respond(c: Context<AppEnv>, error: AppError): Response {
  const response = error.toResponse(c.var.requestId);
  return c.newResponse(response.body, response);
}

export function handleAppError(err: Error, c: Context<AppEnv>): Response {
  if (err instanceof AppError) {
    return respond(c, err);
  }
  if (err instanceof HTTPException) {
    const existing = err.getResponse();
    if (isProblemResponse(existing)) {
      return c.newResponse(existing.body, existing);
    }
    return respond(c, AppError.fromHttpStatus(err.status, { message: err.message }));
  }
  log.error("Internal Server Error", err);
  return respond(c, AppError.fromCause(err));
}

export function notFoundProblem(c: Context<AppEnv>): Response {
  return respond(c, new AppError("NOT_FOUND"));
}

export function payloadTooLargeProblem(c: Context<AppEnv>): Response {
  return respond(c, new AppError("PAYLOAD_TOO_LARGE"));
}

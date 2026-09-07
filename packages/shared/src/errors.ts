import { z } from "zod";

import { errorCatalog, errorCodeSchema } from "./error-catalog.ts";
import type { ErrorCode } from "./error-catalog.ts";

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

const problemInvalidParamSchema = z.object({
  name: z.string().min(1),
  pointer: z.string().min(1).optional(),
  reason: z.string().min(1),
});

export type ProblemInvalidParam = z.infer<typeof problemInvalidParamSchema>;

const problemDetailsSchema = z.object({
  code: errorCodeSchema,
  detail: z.string().min(1),
  errors: z.array(problemInvalidParamSchema).optional(),
  status: z.number().int().min(100).max(599),
  title: z.string().min(1),
  type: z.string().min(1),
});

type ProblemDetails = z.infer<typeof problemDetailsSchema>;

const problemCodeForStatus = (status: number): ErrorCode => {
  switch (status) {
    case 400: {
      return "BAD_REQUEST";
    }
    case 404: {
      return "NOT_FOUND";
    }
    case 408:
    case 504: {
      return "TIMEOUT";
    }
    case 413: {
      return "PAYLOAD_TOO_LARGE";
    }
    default: {
      return status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST";
    }
  }
};

// Untrusted status mappings must not leak internals. Throw AppError directly to send a 5xx message.
const hidesInternalMessage = (status: number): boolean =>
  status === 408 || status === 504 || status >= 500;

const resolvedMessage = (
  definition: (typeof errorCatalog)[ErrorCode],
  message: string | undefined
): string =>
  message !== undefined && message.length > 0 ? message : definition.detail;

const serializeProblem = (error: AppError): ProblemDetails => {
  const problem: ProblemDetails = {
    code: error.code,
    detail: error.message,
    status: error.status,
    title: error.title,
    type: `https://httpproblems.com/http-status/${error.status}`,
  };
  if (error.errors !== undefined && error.errors.length > 0) {
    problem.errors = [...error.errors];
  }
  return problemDetailsSchema.parse(problem);
};

const readProblemDetails = async (
  response: Response
): Promise<ProblemDetails | null> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    return null;
  }
  try {
    const parsed = problemDetailsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export interface AppErrorOptions {
  message?: string;
  errors?: readonly ProblemInvalidParam[];
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly title: string;
  readonly errors: readonly ProblemInvalidParam[] | undefined;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    const definition = errorCatalog[code];
    super(resolvedMessage(definition, options.message), {
      cause: options.cause,
    });
    this.name = "AppError";
    this.code = code;
    this.status = definition.status;
    this.title = definition.title;
    this.errors = options.errors;
  }

  static fromHttpStatus(
    status: number,
    options: AppErrorOptions = {}
  ): AppError {
    const code = problemCodeForStatus(status);
    if (hidesInternalMessage(status)) {
      return new AppError(code, { cause: options.cause });
    }
    return new AppError(code, options);
  }

  static fromCause(cause: unknown): AppError {
    if (cause instanceof AppError) {
      return cause;
    }
    return new AppError("INTERNAL_ERROR", { cause });
  }

  static async fromResponse(response: Response): Promise<AppError> {
    const problem = await readProblemDetails(response);
    if (problem) {
      return new AppError(problem.code, {
        errors: problem.errors,
        message: problem.detail,
      });
    }
    return AppError.fromHttpStatus(response.status);
  }

  toResponse(): Response {
    const problem = serializeProblem(this);
    return Response.json(problem, {
      headers: { "Content-Type": PROBLEM_CONTENT_TYPE },
      status: problem.status,
    });
  }
}

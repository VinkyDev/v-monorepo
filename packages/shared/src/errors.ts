import { type ErrorCode, errorCatalog, errorCodeSchema } from "./error-catalog.ts";
import { getResponseRequestId, isValidRequestId, REQUEST_ID_HEADER } from "./http.ts";
import { z } from "zod";

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

const problemInvalidParamSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  pointer: z.string().min(1).optional(),
});

export type ProblemInvalidParam = z.infer<typeof problemInvalidParamSchema>;

const problemDetailsSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(100).max(599),
  detail: z.string().min(1),
  instance: z.string().min(1).optional(),
  code: errorCodeSchema,
  errors: z.array(problemInvalidParamSchema).optional(),
});

type ProblemDetails = z.infer<typeof problemDetailsSchema>;

function problemCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 404:
      return "NOT_FOUND";
    case 408:
    case 504:
      return "TIMEOUT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST";
  }
}

// Untrusted status mappings must not leak internals. Throw AppError directly to send a 5xx message.
function hidesInternalMessage(status: number): boolean {
  return status === 408 || status === 504 || status >= 500;
}

function resolvedMessage(
  definition: (typeof errorCatalog)[ErrorCode],
  message: string | undefined,
): string {
  return message !== undefined && message.length > 0 ? message : definition.detail;
}

function serializeProblem(error: AppError, requestId?: string): ProblemDetails {
  const problem: ProblemDetails = {
    type: `https://httpproblems.com/http-status/${error.status}`,
    title: error.title,
    status: error.status,
    detail: error.message,
    code: error.code,
  };
  if (requestId !== undefined && isValidRequestId(requestId)) {
    problem.instance = `urn:uuid:${requestId}`;
  }
  if (error.errors !== undefined && error.errors.length > 0) {
    problem.errors = [...error.errors];
  }
  return problemDetailsSchema.parse(problem);
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | null> {
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
}

function requestIdFromInstance(instance: string | undefined): string | undefined {
  const prefix = "urn:uuid:";
  if (instance === undefined || !instance.startsWith(prefix)) {
    return undefined;
  }
  const id = instance.slice(prefix.length);
  return isValidRequestId(id) ? id : undefined;
}

export type AppErrorOptions = {
  message?: string;
  errors?: readonly ProblemInvalidParam[];
  cause?: unknown;
  requestId?: string;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly title: string;
  readonly errors: readonly ProblemInvalidParam[] | undefined;
  readonly requestId: string | undefined;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    const definition = errorCatalog[code];
    super(resolvedMessage(definition, options.message), { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = definition.status;
    this.title = definition.title;
    this.errors = options.errors;
    this.requestId = options.requestId;
  }

  static fromHttpStatus(status: number, options: AppErrorOptions = {}): AppError {
    const code = problemCodeForStatus(status);
    if (hidesInternalMessage(status)) {
      return new AppError(code, { cause: options.cause, requestId: options.requestId });
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
    const requestId = getResponseRequestId(response) ?? undefined;
    const problem = await readProblemDetails(response);
    if (problem) {
      return new AppError(problem.code, {
        message: problem.detail,
        errors: problem.errors,
        requestId: requestId ?? requestIdFromInstance(problem.instance),
      });
    }
    return AppError.fromHttpStatus(response.status, { requestId });
  }

  toResponse(requestId?: string): Response {
    const problem = serializeProblem(this, requestId);
    const headers = new Headers({ "Content-Type": PROBLEM_CONTENT_TYPE });
    if (requestId !== undefined && isValidRequestId(requestId)) {
      headers.set(REQUEST_ID_HEADER, requestId);
    }
    return new Response(JSON.stringify(problem), {
      status: problem.status,
      headers,
    });
  }
}

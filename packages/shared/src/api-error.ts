import { z } from "zod";

import {
  codeForStatus,
  errorCatalog,
  isErrorCode,
  parseErrorData,
} from "./error-catalog.ts";
import type { ErrorCode, ErrorData, ErrorStatus } from "./error-catalog.ts";

/** The wire format. A non-2xx status already says "this failed", so there is no envelope. */
export const errorBodySchema = z.object({
  code: z.string().min(1),
  data: z.json().optional(),
  message: z.string().min(1),
});

export type ApiErrorBody = z.infer<typeof errorBodySchema>;

/** Enough to locate the call in a log; no query, headers or body that could carry secrets. */
export interface RequestSummary {
  readonly method: string;
  readonly path: string;
  /** Absent when the request never reached a response. */
  readonly status?: number;
}

export interface ApiErrorContext {
  /** From the `X-Request-Id` response header. */
  traceId?: string;
  request?: RequestSummary;
  cause?: unknown;
}

export interface ApiErrorOptions<C extends ErrorCode> extends ApiErrorContext {
  message?: string;
  data?: ErrorData<C>;
}

const readErrorBody = async (
  response: Response
): Promise<ApiErrorBody | null> => {
  if (!(response.headers.get("content-type") ?? "").includes("json")) {
    return null;
  }
  try {
    const parsed = errorBodySchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

// `Symbol.for` survives the duplicate copies of this module that web, Electron main
// and preload each bundle, where `instanceof` would not.
const apiErrorBrand: unique symbol = Symbol.for("@v-monorepo/shared/ApiError");

export class ApiError<C extends ErrorCode = ErrorCode> extends Error {
  readonly [apiErrorBrand] = true;
  readonly code: C;
  readonly status: ErrorStatus;
  readonly data: ErrorData<C> | undefined;
  readonly traceId: string | undefined;
  readonly request: RequestSummary | undefined;

  constructor(code: C, options: ApiErrorOptions<C> = {}) {
    super(options.message ?? errorCatalog[code].message, {
      cause: options.cause,
    });
    this.name = "ApiError";
    this.code = code;
    this.status = errorCatalog[code].status;
    this.data = options.data;
    this.traceId = options.traceId;
    this.request = options.request;
  }

  /** `fallback` stands in for a code we do not know; each transport picks its own. */
  static fromBody(
    body: ApiErrorBody,
    fallback: ErrorCode,
    context: ApiErrorContext = {}
  ): ApiError {
    const code = isErrorCode(body.code) ? body.code : fallback;
    return new ApiError(code, {
      ...context,
      data: parseErrorData(code, body.data),
      message: body.message,
    });
  }

  static async fromResponse(
    response: Response,
    context: ApiErrorContext = {}
  ): Promise<ApiError> {
    const fallback = codeForStatus(response.status);
    const resolved: ApiErrorContext = {
      ...context,
      traceId: response.headers.get("x-request-id") ?? context.traceId,
    };
    const body = await readErrorBody(response);
    return body === null
      ? new ApiError(fallback, resolved)
      : ApiError.fromBody(body, fallback, resolved);
  }

  toBody(): ApiErrorBody {
    return this.data === undefined
      ? { code: this.code, message: this.message }
      : { code: this.code, data: this.data, message: this.message };
  }
}

/** Pass `code` to narrow `data` too: `isApiError(e, "email_taken")`. */
export const isApiError = <C extends ErrorCode = ErrorCode>(
  value: unknown,
  code?: C
): value is ApiError<C> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!(apiErrorBrand in value) || value[apiErrorBrand] !== true) {
    return false;
  }
  return code === undefined || ("code" in value && value.code === code);
};

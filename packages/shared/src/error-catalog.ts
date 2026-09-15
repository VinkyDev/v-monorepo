import { z } from "zod";

export interface ErrorDefinition {
  readonly status: number;
  readonly message: string;
}

export const BODY_LIMIT_BYTES = 1024 * 1024;

const bodyLimitMb = BODY_LIMIT_BYTES / (1024 * 1024);

/** Protocol layer: one code per HTTP status, and each status appears exactly once. */
const protocolErrors = {
  bad_request: { message: "请求无效", status: 400 },
  conflict: { message: "资源状态冲突，请刷新后重试", status: 409 },
  forbidden: { message: "没有权限执行此操作", status: 403 },
  internal: { message: "服务异常，请稍后重试", status: 500 },
  invalid_params: { message: "参数校验失败", status: 422 },
  not_found: { message: "请求的资源不存在", status: 404 },
  payload_too_large: {
    message: `请求体超过 ${bodyLimitMb}MB 限制`,
    status: 413,
  },
  rate_limited: { message: "请求过于频繁，请稍后再试", status: 429 },
  timeout: { message: "请求超时", status: 504 },
  unauthorized: { message: "登录已失效，请重新登录", status: 401 },
  unavailable: { message: "服务暂时不可用", status: 503 },
} as const satisfies Record<string, ErrorDefinition>;

/** Domain layer: the extension point. Statuses may repeat, here and above. */
const businessErrors = {
  email_taken: { message: "该邮箱已被注册", status: 409 },
  session_expired: { message: "会话已过期，请重新登录", status: 401 },
} as const satisfies Record<string, ErrorDefinition>;

export const errorCatalog = { ...protocolErrors, ...businessErrors };

export type ErrorCode = keyof typeof errorCatalog;

/** Literal, so responders typed against HTTP status unions accept it without a cast. */
export type ErrorStatus = (typeof errorCatalog)[ErrorCode]["status"];

export const isErrorCode = (value: string): value is ErrorCode =>
  Object.hasOwn(errorCatalog, value);

/** `path` is dotted (`user.name`) to match what form libraries index by. */
const fieldErrorSchema = z.object({
  message: z.string().min(1),
  path: z.string(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

/** Codes that carry a structured payload. Any code absent here has `data: undefined`. */
const errorDataSchemas = {
  email_taken: z.object({ email: z.string() }),
  invalid_params: z.object({ fields: z.array(fieldErrorSchema) }),
  rate_limited: z.object({ retryAfterMs: z.number().int().nonnegative() }),
} as const satisfies Partial<Record<ErrorCode, z.ZodType>>;

type ErrorDataMap = {
  [K in keyof typeof errorDataSchemas]: z.infer<(typeof errorDataSchemas)[K]>;
};

export type ErrorData<C extends ErrorCode> = C extends keyof ErrorDataMap
  ? ErrorDataMap[C]
  : undefined;

/** Every payload the catalog can carry, before a `code` narrows it down. */
export type ErrorDataValue = ErrorDataMap[keyof ErrorDataMap];

export type JsonValue = z.infer<ReturnType<typeof z.json>>;

// Typed by the union output so `parseErrorData` returns a domain type without asserting.
const dataSchemas: Partial<Record<ErrorCode, z.ZodType<ErrorDataValue>>> =
  errorDataSchemas;

/** Silently drops `data` that does not match: a bad payload must not mask the code. */
export const parseErrorData = (
  code: ErrorCode,
  data: JsonValue | undefined
): ErrorDataValue | undefined => {
  const parsed = dataSchemas[code]?.safeParse(data);
  return parsed?.success === true ? parsed.data : undefined;
};

/** The codes a status can degrade into. Their statuses must stay unique — a test guards it. */
export const protocolCodes: readonly ErrorCode[] =
  Object.keys(protocolErrors).filter(isErrorCode);

const codeByStatus = new Map<number, ErrorCode>(
  protocolCodes.map((code) => [errorCatalog[code].status, code])
);

/** Recovers a code from a response we did not produce — a gateway or a proxy. */
export const codeForStatus = (status: number): ErrorCode =>
  codeByStatus.get(status) ?? (status >= 500 ? "internal" : "bad_request");

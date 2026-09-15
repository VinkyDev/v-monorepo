import { z } from "zod";

export interface ErrorDefinition {
  readonly status: number;
  readonly message: string;
}

export const BODY_LIMIT_BYTES = 1024 * 1024;

const bodyLimitMb = BODY_LIMIT_BYTES / (1024 * 1024);

/** 协议层：每个 HTTP status 只出现一次。 */
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

/** 业务层：status 允许重复。 */
const businessErrors = {
  email_taken: { message: "该邮箱已被注册", status: 409 },
  session_expired: { message: "会话已过期，请重新登录", status: 401 },
} as const satisfies Record<string, ErrorDefinition>;

export const errorCatalog = { ...protocolErrors, ...businessErrors };

export type ErrorCode = keyof typeof errorCatalog;

export type ErrorStatus = (typeof errorCatalog)[ErrorCode]["status"];

export const isErrorCode = (value: string): value is ErrorCode =>
  Object.hasOwn(errorCatalog, value);

const fieldErrorSchema = z.object({
  message: z.string().min(1),
  path: z.string(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

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

export type ErrorDataValue = ErrorDataMap[keyof ErrorDataMap];

export type JsonValue = z.infer<ReturnType<typeof z.json>>;

const dataSchemas: Partial<Record<ErrorCode, z.ZodType<ErrorDataValue>>> =
  errorDataSchemas;

/** 丢弃不匹配的 `data` */
export const parseErrorData = (
  code: ErrorCode,
  data: JsonValue | undefined
): ErrorDataValue | undefined => {
  const parsed = dataSchemas[code]?.safeParse(data);
  return parsed?.success === true ? parsed.data : undefined;
};

export const protocolCodes: readonly ErrorCode[] =
  Object.keys(protocolErrors).filter(isErrorCode);

const codeByStatus = new Map<number, ErrorCode>(
  protocolCodes.map((code) => [errorCatalog[code].status, code])
);

/** 从非本服务的响应（gateway、proxy）恢复 code */
export const codeForStatus = (status: number): ErrorCode =>
  codeByStatus.get(status) ?? (status >= 500 ? "internal" : "bad_request");

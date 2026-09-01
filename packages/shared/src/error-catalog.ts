import { z } from "zod";

export interface ErrorDefinition {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
}

// Single owner of the body limit: server middleware enforces it, catalog copy derives from it.
export const BODY_LIMIT_BYTES = 1024 * 1024;

const bodyLimitMb = BODY_LIMIT_BYTES / (1024 * 1024);

export const protocolErrors = {
  BAD_REQUEST: {
    detail: "请求无效",
    status: 400,
    title: "请求无效",
  },
  INTERNAL_ERROR: {
    detail: "服务异常，请稍后重试",
    status: 500,
    title: "服务异常",
  },
  NOT_FOUND: {
    detail: "请求的资源不存在",
    status: 404,
    title: "资源不存在",
  },
  PAYLOAD_TOO_LARGE: {
    detail: `请求体超过 ${bodyLimitMb}MB 限制`,
    status: 413,
    title: "请求体过大",
  },
  TIMEOUT: {
    detail: "请求超时",
    status: 504,
    title: "请求超时",
  },
  VALIDATION_ERROR: {
    detail: "参数校验失败",
    status: 400,
    title: "参数校验失败",
  },
} as const satisfies Record<string, ErrorDefinition>;

/** Domain codes. Add an entry here; both server and client pick it up. */
export const businessErrors = {} as const satisfies Record<
  string,
  ErrorDefinition
>;

export const errorCatalog = {
  ...protocolErrors,
  ...businessErrors,
};

export type ProtocolErrorCode = keyof typeof protocolErrors;
export type BusinessErrorCode = keyof typeof businessErrors;
export type ErrorCode = keyof typeof errorCatalog;

export const errorCodeSchema = z
  .string()
  .refine((code): code is ErrorCode => code in errorCatalog);

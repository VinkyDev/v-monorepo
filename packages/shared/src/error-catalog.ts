import { z } from "zod";

export type ErrorDefinition = {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
};

export const protocolErrors = {
  BAD_REQUEST: {
    status: 400,
    title: "请求无效",
    detail: "请求无效",
  },
  VALIDATION_ERROR: {
    status: 400,
    title: "参数校验失败",
    detail: "参数校验失败",
  },
  NOT_FOUND: {
    status: 404,
    title: "资源不存在",
    detail: "请求的资源不存在",
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    title: "请求体过大",
    detail: "请求体超过 1MB 限制",
  },
  TIMEOUT: {
    status: 504,
    title: "请求超时",
    detail: "请求超时",
  },
  INTERNAL_ERROR: {
    status: 500,
    title: "服务异常",
    detail: "服务异常，请稍后重试",
  },
} as const satisfies Record<string, ErrorDefinition>;

/** Domain codes. Add an entry here; both server and client pick it up. */
export const businessErrors = {} as const satisfies Record<string, ErrorDefinition>;

export const errorCatalog = {
  ...protocolErrors,
  ...businessErrors,
};

export type ProtocolErrorCode = keyof typeof protocolErrors;
export type BusinessErrorCode = keyof typeof businessErrors;
export type ErrorCode = keyof typeof errorCatalog;

// SAFETY: errorCatalog is keyed only by ErrorCode; Object.keys widens that to string[].
const errorCodes = Object.keys(errorCatalog) as [ErrorCode, ...ErrorCode[]];

export const errorCodeSchema = z.enum(errorCodes);

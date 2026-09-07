import { createLogger } from "@v-monorepo/logger";
import { AppError } from "@v-monorepo/shared";

const log = createLogger({ name: "web" });

export interface RouteErrorView {
  title: string;
  detail: string | undefined;
  requestId: string | undefined;
}

export const routeErrorView = (error: Error): RouteErrorView => {
  const appError = AppError.fromCause(error);
  return {
    detail: appError.message === appError.title ? undefined : appError.message,
    requestId: appError.requestId,
    title: appError.title,
  };
};

export const logRouteError = (error: Error): void => {
  log.error("Route error", error);
};

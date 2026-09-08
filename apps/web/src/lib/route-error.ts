import { AppError } from "@v-monorepo/shared";

export interface RouteErrorView {
  title: string;
  detail: string | undefined;
}

export const routeErrorView = (error: Error): RouteErrorView => {
  const appError = AppError.fromCause(error);
  return {
    detail: appError.message === appError.title ? undefined : appError.message,
    title: appError.title,
  };
};

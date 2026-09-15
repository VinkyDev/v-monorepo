import type { AppError } from "@v-monorepo/shared";

export interface RouteErrorView {
  title: string;
  detail: string | undefined;
}

export const routeErrorView = (error: AppError): RouteErrorView => ({
  detail: error.message === error.title ? undefined : error.message,
  title: error.title,
});

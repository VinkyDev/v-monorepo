import { CatchBoundary } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { logger, toError } from "@v-monorepo/logger";
import type { ReactNode } from "react";

import { toErrorView } from "#/lib/error-view.ts";

const BoundaryFallback = ({ error }: ErrorComponentProps) => (
  <div
    className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm"
    role="alert"
  >
    {toErrorView(error).message}
  </div>
);

interface AppBoundaryProps {
  /** Stable key for aggregation; it must not contain dynamic values. */
  name: string;
  children: ReactNode;
}

/** Keeps one failing widget from taking the page down. Whole pages are the router's job. */
export const AppBoundary = ({ name, children }: AppBoundaryProps) => (
  <CatchBoundary
    errorComponent={BoundaryFallback}
    getResetKey={() => name}
    onCatch={(cause) => {
      const error = toError(cause);
      logger.error({
        error,
        event: "boundary_caught",
        message: error.message,
        meta: { boundary: name },
      });
    }}
  >
    {children}
  </CatchBoundary>
);

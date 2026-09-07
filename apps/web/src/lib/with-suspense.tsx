import { Suspense } from "react";
import type { ComponentType, ReactNode } from "react";

import { PendingFallback } from "#/components/default-pending.tsx";

const defaultFallback = <PendingFallback />;

export const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  fallback: ReactNode = defaultFallback
) => {
  const Suspended = (props: Props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  return Suspended;
};

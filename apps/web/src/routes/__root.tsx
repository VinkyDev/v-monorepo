import { Outlet, createRootRoute } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@v-monorepo/ui/components/toast";
import type { ReactNode } from "react";

import { ErrorScreen, NotFoundScreen } from "#/components/error-screen.tsx";

const RootShell = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <Toaster />
    <TanStackRouterDevtools />
  </>
);

const RootComponent = () => (
  <RootShell>
    <Outlet />
  </RootShell>
);

const RootErrorComponent = (props: ErrorComponentProps) => (
  <RootShell>
    <ErrorScreen {...props} />
  </RootShell>
);

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundScreen,
});

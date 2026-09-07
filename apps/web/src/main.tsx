import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@v-monorepo/ui/globals.css";
import { DefaultErrorComponent } from "#/components/default-error.tsx";
import { DefaultPendingComponent } from "#/components/default-pending.tsx";
import "#/env.ts";
import { createQueryClient } from "#/lib/query-client.ts";
import { logRouteError } from "#/lib/route-error.ts";

import { routeTree } from "./routeTree.gen";

const queryClient = createQueryClient();

const router = createRouter({
  defaultErrorComponent: DefaultErrorComponent,
  defaultOnCatch: logRouteError,
  defaultPendingComponent: DefaultPendingComponent,
  defaultPreload: "intent",
  routeTree,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.querySelector("#root");
if (rootElement === null) {
  throw new Error("missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

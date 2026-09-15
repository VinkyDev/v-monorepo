import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { addSink, consoleSink, logger, toError } from "@v-monorepo/logger";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@v-monorepo/ui/globals.css";
import { DefaultPendingComponent } from "#/components/default-pending.tsx";
import { ErrorScreen, NotFoundScreen } from "#/components/error-screen.tsx";
import "#/env.ts";
import { createQueryClient } from "#/lib/query-client.ts";

import { routeTree } from "./routeTree.gen";

// Entry points compose the sinks; a monitoring backend is one more `addSink` here.
addSink(consoleSink);

// A chunk that 404s after a deploy never recovers by retrying — the file is gone.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

const reportRenderError =
  (event: string) =>
  (cause: unknown, info: { componentStack?: string | null }): void => {
    const error = toError(cause);
    logger.fatal({
      error,
      event,
      message: error.message,
      meta: { componentStack: info.componentStack ?? undefined },
    });
  };

const queryClient = createQueryClient();

const router = createRouter({
  defaultErrorComponent: ErrorScreen,
  defaultNotFoundComponent: NotFoundScreen,
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

createRoot(rootElement, {
  onCaughtError: reportRenderError("react_caught_error"),
  onRecoverableError: reportRenderError("react_recoverable_error"),
  onUncaughtError: reportRenderError("react_uncaught_error"),
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

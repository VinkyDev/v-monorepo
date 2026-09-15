import { logger, toError } from "@v-monorepo/logger";
import { app } from "electron";

/** The last line of defence, so a crash is never silent. */
export const watchCrashes = (): void => {
  process.on("uncaughtException", (cause) => {
    logger.fatal({
      error: cause,
      event: "desktop_uncaught_exception",
      message: cause.message,
    });
  });

  process.on("unhandledRejection", (cause) => {
    const error = toError(cause);
    logger.fatal({
      error,
      event: "desktop_unhandled_rejection",
      message: error.message,
    });
  });

  app.on("render-process-gone", (_event, _contents, details) => {
    logger.fatal({
      error: new Error(details.reason),
      event: "desktop_render_process_gone",
      message: `renderer gone: ${details.reason}`,
      meta: { exitCode: details.exitCode, reason: details.reason },
    });
  });

  app.on("child-process-gone", (_event, details) => {
    logger.fatal({
      error: new Error(details.reason),
      event: "desktop_child_process_gone",
      message: `${details.type} gone: ${details.reason}`,
      meta: {
        exitCode: details.exitCode,
        reason: details.reason,
        type: details.type,
      },
    });
  });
};

import { expect, test } from "vite-plus/test";
import { createApp } from "@v-monorepo/server";
import {
  AppError,
  errorCatalog,
  getResponseRequestId,
  healthStatusSchema,
  isValidRequestId,
} from "@v-monorepo/shared";
import { createApiClient } from "../src/index.ts";

function clientFor(app: ReturnType<typeof createApp>, baseUrl: string) {
  return createApiClient(baseUrl, {
    fetch: async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      return app.fetch(request);
    },
  });
}

async function expectAppError(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (cause) {
    if (cause instanceof AppError) {
      return cause;
    }
    throw cause;
  }
  throw new Error("expected the client to throw");
}

test("createApiClient reads a successful health response from the server", async () => {
  const client = clientFor(createApp(), "http://v-monorepo.test/api");
  const response = await client.health.$get();
  expect(response.status).toBe(200);
  expect(healthStatusSchema.parse(await response.json()).status).toBe("ok");
  const requestId = getResponseRequestId(response);
  expect(requestId !== null && isValidRequestId(requestId)).toBe(true);
});

test("createApiClient throws AppError when the server returns a problem", async () => {
  const client = clientFor(createApp(), "http://v-monorepo.test/api/missing");
  const error = await expectAppError(client.health.$get());
  expect(error.code).toBe("NOT_FOUND");
  expect(error.title).toBe(errorCatalog.NOT_FOUND.title);
  expect(error.message).toBe(errorCatalog.NOT_FOUND.detail);
});

test("createApiClient wraps network failures as AppError", async () => {
  const client = createApiClient("https://api.test", {
    fetch: async () => {
      throw new Error("network down");
    },
  });

  const error = await expectAppError(client.health.$get());
  expect(error.code).toBe("INTERNAL_ERROR");
  expect(error.message).toBe(errorCatalog.INTERNAL_ERROR.detail);
  expect(error.title).toBe(errorCatalog.INTERNAL_ERROR.title);
  expect(error.cause).toBeInstanceOf(Error);
});

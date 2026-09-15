import { describe, expect, test } from "vite-plus/test";
import { z } from "zod";

import { createApp } from "#/app.ts";

const documentSchema = z.object({
  components: z.object({
    responses: z.record(z.string(), z.looseObject({ description: z.string() })),
  }),
  paths: z.record(
    z.string(),
    z.record(
      z.string(),
      z.looseObject({ responses: z.record(z.string(), z.unknown()) })
    )
  ),
});

const readDocument = async () => {
  const response = await createApp().request("/openapi.json");
  expect(response.status).toBe(200);
  return documentSchema.parse(await response.json());
};

describe("openapi document", () => {
  test("registers the error body once and references it everywhere", async () => {
    const document = await readDocument();

    expect(document.components.responses.ClientError?.content).toMatchObject({
      "application/json": {
        schema: { properties: { code: {}, data: {}, message: {} } },
      },
    });

    for (const [path, operations] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        expect(operation.responses, `${method} ${path}`).toMatchObject({
          "4XX": { $ref: "#/components/responses/ClientError" },
          "5XX": { $ref: "#/components/responses/ServerError" },
        });
      }
    }
  });

  test("documents a validated request body from the validator", async () => {
    const document = await readDocument();

    expect(document.paths["/demo/signup"]?.post).toMatchObject({
      requestBody: {
        content: {
          "application/json": {
            schema: { required: ["email", "name"] },
          },
        },
      },
    });
  });
});

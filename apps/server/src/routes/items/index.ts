import { itemSchema } from "@v-monorepo/shared";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";

import { validateJson } from "#/validate.ts";

export const itemRoutes = new Hono().post(
  "/",
  describeRoute({
    description: "Creates an item. An empty name returns VALIDATION_ERROR.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: resolver(itemSchema),
          },
        },
        description: "Created item",
      },
    },
    summary: "Create item",
    tags: ["Items"],
  }),
  validateJson(itemSchema),
  (c) => c.json(c.req.valid("json"))
);

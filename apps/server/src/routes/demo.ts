import { ApiError } from "@v-monorepo/shared";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { validate } from "#/lib/validate.ts";

/** A tour of the error contract. Delete this folder and its route to drop it. */
const probeSchema = z.object({
  fail: z
    .enum(["unauthorized", "not_found", "timeout", "session_expired", "crash"])
    .optional(),
});

const signupSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
});

const takenEmail = "taken@example.com";

export const demoRoutes = new Hono()
  .get(
    "/probe",
    describeRoute({
      summary: "按 ?fail=<code> 抛出对应错误；不传则成功",
      tags: ["Demo"],
    }),
    validate("query", probeSchema),
    (c) => {
      const { fail } = c.req.valid("query");
      if (fail === "crash") {
        // Not an ApiError: the edge must hide it behind a generic 500.
        throw new Error("secret internals");
      }
      if (fail !== undefined) {
        throw new ApiError(fail);
      }
      return c.json({ ok: true });
    }
  )
  .post(
    "/signup",
    describeRoute({
      summary: "校验失败返回 422 fields；重复邮箱返回 409 业务码",
      tags: ["Demo"],
    }),
    validate("json", signupSchema),
    (c) => {
      const { email, name } = c.req.valid("json");
      if (email === takenEmail) {
        throw new ApiError("email_taken", { data: { email } });
      }
      return c.json({ email, name });
    }
  );

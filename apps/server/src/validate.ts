import { sValidator } from "@hono/standard-validator";
import { AppError } from "@v-monorepo/shared";
import type { ProblemInvalidParam } from "@v-monorepo/shared";
import { z } from "zod";

const keyedPathSchema = z.object({
  key: z.union([z.string(), z.number()]),
});

const pathSegmentSchema = z.union([z.string(), z.number(), keyedPathSchema]);

const issueSchema = z.object({
  message: z.string(),
  path: z.array(pathSegmentSchema).optional(),
});

const pathKey = (segment: z.infer<typeof pathSegmentSchema>): string => {
  const keyed = keyedPathSchema.safeParse(segment);
  if (keyed.success) {
    return String(keyed.data.key);
  }
  const primitive = z.union([z.string(), z.number()]).safeParse(segment);
  if (primitive.success) {
    return String(primitive.data);
  }
  return "request";
};

const invalidParamFromIssue = (
  issue: z.infer<typeof issueSchema>
): ProblemInvalidParam => {
  const keys = (issue.path ?? []).map(pathKey);
  if (keys.length === 0) {
    return { name: "request", reason: issue.message };
  }
  return {
    name: keys.join("."),
    pointer: `/${keys.join("/")}`,
    reason: issue.message,
  };
};

export const validateJson = <Schema extends z.ZodType>(schema: Schema) =>
  sValidator("json", schema, (result) => {
    if (result.success) {
      return;
    }
    const issues = z.array(issueSchema).safeParse(result.error);
    throw new AppError("VALIDATION_ERROR", {
      errors: issues.success
        ? issues.data.map(invalidParamFromIssue)
        : undefined,
    });
  });

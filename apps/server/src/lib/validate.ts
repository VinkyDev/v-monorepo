import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ApiError } from "@v-monorepo/shared";
import type { FieldError } from "@v-monorepo/shared";
import type { ValidationTargets } from "hono";
import { validator } from "hono-openapi";

type PathSegment = StandardSchemaV1.PathSegment | PropertyKey;

/** Standard Schema lets a path segment be a bare key or a `{ key }` wrapper. */
const isKeyedSegment = (
  segment: PathSegment
): segment is StandardSchemaV1.PathSegment => typeof segment === "object";

const segmentKey = (segment: PathSegment): string =>
  String(isKeyedSegment(segment) ? segment.key : segment);

const toFieldError = (issue: StandardSchemaV1.Issue): FieldError => ({
  message: issue.message,
  path: (issue.path ?? []).map(segmentKey).join("."),
});

/** Validates a request target and documents its schema in the OpenAPI spec. */
export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends StandardSchemaV1,
>(
  target: Target,
  schema: Schema
) =>
  validator(target, schema, (result) => {
    if (result.success) {
      return;
    }
    throw new ApiError("invalid_params", {
      data: { fields: result.error.map(toFieldError) },
    });
  });

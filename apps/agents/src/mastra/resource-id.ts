import { z } from "zod";

export const RESOURCE_ID_HEADER = "x-mastra-resource-id";

const resourceIdSchema = z.string().min(1);

export const readResourceId = (request: Request): string | undefined => {
  const parsed = resourceIdSchema.safeParse(
    request.headers.get(RESOURCE_ID_HEADER)
  );
  return parsed.success ? parsed.data : undefined;
};

export const publicCors = {
  allowHeaders: ["Accept", "Content-Type", RESOURCE_ID_HEADER],
  allowMethods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
  origin: "*",
};

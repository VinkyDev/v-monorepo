import { z } from "zod";

export const healthStatusSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  timestamp: z.iso.datetime(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

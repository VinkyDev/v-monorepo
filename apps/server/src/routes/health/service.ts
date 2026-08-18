import { type HealthStatus, healthStatusSchema } from "@v-monorepo/shared";

export function getHealthStatus(): HealthStatus {
  return healthStatusSchema.parse({
    status: "ok",
    service: "v-monorepo-server",
    timestamp: new Date().toISOString(),
  });
}

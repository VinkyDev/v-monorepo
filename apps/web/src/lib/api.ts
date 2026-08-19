import { createApiClient } from "@v-monorepo/api-client";
import { env } from "@/env.ts";

export const apiClient = createApiClient(env.VITE_API_BASE_URL);

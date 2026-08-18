import { createBrowserApiClient } from "@v-monorepo/api-client";
import { env } from "../env.ts";

export const apiClient = createBrowserApiClient(env.VITE_API_BASE_URL);

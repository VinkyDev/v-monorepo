import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@v-monorepo/api-client";
import { getResponseRequestId } from "@v-monorepo/shared";

import { apiClient } from "#/lib/api.ts";

export const healthQueryOptions = (client: ApiClient = apiClient) =>
  queryOptions({
    queryFn: async () => {
      const response = await client.health.$get();
      return {
        ...(await response.json()),
        requestId: getResponseRequestId(response),
      };
    },
    queryKey: ["health"],
  });

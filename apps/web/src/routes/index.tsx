import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { isDesktop } from "@v-monorepo/electron";
import { Button } from "@v-monorepo/ui/components/button";

import { apiClient } from "#/lib/api.ts";
import { lazyComponent } from "#/lib/lazy-component.ts";
import { withSuspense } from "#/lib/with-suspense.tsx";

const DesktopDemo = withSuspense(
  lazyComponent(async () => await import("#/components/desktop-demo.tsx"))
);

const HealthDemo = () => {
  const { data, isFetching, refetch } = useQuery({
    enabled: false,
    queryFn: async () => {
      const response = await apiClient.health.$get();
      return await response.json();
    },
    queryKey: ["health"],
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        Hono RPC
      </h2>
      <div className="border-border bg-card flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">GET /api/health</p>
          <Button
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? "检查中…" : "检查健康"}
          </Button>
        </div>

        {!data && !isFetching ? (
          <p className="text-muted-foreground text-sm">
            通过 Hono RPC 调用服务端
          </p>
        ) : null}

        {data ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-sm">
            <dt className="text-muted-foreground">status</dt>
            <dd>{data.status}</dd>
            <dt className="text-muted-foreground">service</dt>
            <dd>{data.service}</dd>
            <dt className="text-muted-foreground">timestamp</dt>
            <dd className="break-all">{data.timestamp}</dd>
          </dl>
        ) : null}
      </div>
    </section>
  );
};

const Home = () => (
  <main className="bg-background text-foreground mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
    <header>
      <h1 className="font-heading text-3xl tracking-tight">v-monorepo</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        UI 来自 <code>@v-monorepo/ui</code>，请求走 Hono RPC
      </p>
    </header>

    {isDesktop() ? <DesktopDemo /> : null}

    <HealthDemo />
  </main>
);

export const Route = createFileRoute("/")({
  component: Home,
});

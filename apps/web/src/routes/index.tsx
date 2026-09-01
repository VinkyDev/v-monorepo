import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@v-monorepo/ui/components/button";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { DesktopDemo } from "#/components/desktop-demo.tsx";
import { healthQueryOptions } from "#/lib/queries/health.ts";

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const sizes = ["xs", "sm", "default", "lg"] as const;

const HealthDemo = () => {
  const { data, isFetching, refetch } = useQuery({
    ...healthQueryOptions(),
    enabled: false,
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        Hono RPC · 健康检查
      </h2>
      <div className="border-border bg-card flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            <code>@tanstack/react-query</code> · GET /api/health
          </p>
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
            点击按钮通过 Hono RPC 调用服务端
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
            <dt className="text-muted-foreground">x-request-id</dt>
            <dd className="break-all">{data.requestId ?? "（响应头缺失）"}</dd>
          </dl>
        ) : null}
      </div>
    </section>
  );
};

const Home = () => {
  const [count, setCount] = useState(0);

  return (
    <main className="bg-background text-foreground mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
      <header>
        <h1 className="font-heading text-3xl tracking-tight">
          组件与 RPC 演示
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          UI 来自 <code>@v-monorepo/ui</code>，请求走 Hono RPC
        </p>
      </header>

      <DesktopDemo />

      <HealthDemo />

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          Button · 交互
        </h2>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-6">
          <Button
            onClick={() => {
              setCount((value) => value + 1);
            }}
          >
            Count is {count}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCount(0);
            }}
          >
            重置
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          Button · 变体
        </h2>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-6">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          Button · 尺寸
        </h2>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-6">
          {sizes.map((size) => (
            <Button key={size} size={size} variant="outline">
              {size}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          Button · 图标
        </h2>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-6">
          <Button>
            继续
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="secondary">
            <Plus data-icon="inline-start" />
            新建项目
          </Button>
          <Button variant="destructive">
            <Trash2 data-icon="inline-start" />
            删除
          </Button>
          <Button variant="outline" size="icon" aria-label="新建">
            <Plus />
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          Button · 状态
        </h2>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-6">
          <Button disabled>禁用</Button>
          <Button variant="outline" disabled>
            禁用
          </Button>
        </div>
      </section>
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: Home,
});

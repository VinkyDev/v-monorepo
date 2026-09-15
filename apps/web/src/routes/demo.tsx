import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { isApiError } from "@v-monorepo/shared";
import type { FieldError } from "@v-monorepo/shared";
import { Button } from "@v-monorepo/ui/components/button";
import { useState } from "react";

import { apiClient } from "#/lib/api.ts";

type ProbeFailure = Parameters<
  typeof apiClient.demo.probe.$get
>[0]["query"]["fail"];

const probes: { fail: ProbeFailure; label: string }[] = [
  { fail: undefined, label: "成功" },
  { fail: "unauthorized", label: "401 unauthorized" },
  { fail: "not_found", label: "404 not_found" },
  { fail: "timeout", label: "504 timeout" },
  { fail: "crash", label: "500 internal（服务端未受控异常）" },
  { fail: "session_expired", label: "401 session_expired（全局副作用）" },
];

const Section = ({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) => (
  <section className="flex flex-col gap-4">
    <div>
      <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        {title}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
    <div className="border-border bg-card flex flex-col gap-4 rounded-lg border p-6">
      {children}
    </div>
  </section>
);

const ProbeDemo = () => {
  const probe = useMutation({
    mutationFn: async (fail: ProbeFailure) => {
      const response = await apiClient.demo.probe.$get({ query: { fail } });
      return await response.json();
    },
  });

  return (
    <Section
      description="每个按钮触发一种服务端错误。除 session_expired 由全局副作用接管外，其余统一冒泡成 toast。"
      title="协议码与业务码"
    >
      <div className="flex flex-wrap gap-3">
        {probes.map(({ fail, label }) => (
          <Button
            disabled={probe.isPending}
            key={label}
            onClick={() => {
              probe.mutate(fail);
            }}
            variant={fail === undefined ? "default" : "outline"}
          >
            {label}
          </Button>
        ))}
      </div>
      {probe.isSuccess ? (
        <p className="text-muted-foreground font-mono text-sm">
          {JSON.stringify(probe.data)}
        </p>
      ) : null}
    </Section>
  );
};

const fieldMessage = (
  fields: readonly FieldError[],
  path: string
): string | undefined => fields.find((field) => field.path === path)?.message;

const SignupDemo = () => {
  const [email, setEmail] = useState("taken@example.com");
  const [name, setName] = useState("Ada");

  const signup = useMutation({
    meta: { showErrorToast: false },
    mutationFn: async (json: { email: string; name: string }) => {
      const response = await apiClient.demo.signup.$post({ json });
      return await response.json();
    },
  });

  const invalid = isApiError(signup.error, "invalid_params")
    ? (signup.error.data?.fields ?? [])
    : [];
  const takenEmail = isApiError(signup.error, "email_taken")
    ? signup.error.data?.email
    : undefined;

  return (
    <Section
      description="422 的 data.fields 落到对应输入框；409 email_taken 的 data.email 用于精准文案。"
      title="带结构化 data 的错误"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          signup.mutate({ email, name });
        }}
      >
        <Field
          error={fieldMessage(invalid, "email")}
          label="email"
          onChange={setEmail}
          value={email}
        />
        <Field
          error={fieldMessage(invalid, "name")}
          label="name"
          onChange={setName}
          value={name}
        />
        {takenEmail === undefined ? null : (
          <p className="text-destructive text-sm">
            {takenEmail} 已被注册，换一个邮箱试试。
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button disabled={signup.isPending} type="submit">
            提交
          </Button>
          {signup.isSuccess ? (
            <span className="text-muted-foreground font-mono text-sm">
              {JSON.stringify(signup.data)}
            </span>
          ) : null}
        </div>
      </form>
    </Section>
  );
};

const Field = ({
  error,
  label,
  onChange,
  value,
}: {
  error: string | undefined;
  label: string;
  onChange: (next: string) => void;
  value: string;
}) => (
  <label className="flex flex-col gap-1.5 text-sm">
    <span className="text-muted-foreground font-mono">{label}</span>
    <input
      className="border-border bg-background focus-visible:border-ring focus-visible:ring-ring/30 rounded-md border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2"
      onChange={(event) => {
        onChange(event.target.value);
      }}
      value={value}
    />
    {error === undefined ? null : (
      <span className="text-destructive">{error}</span>
    )}
  </label>
);

const Demo = () => (
  <main className="bg-background text-foreground mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
    <header>
      <h1 className="font-heading text-3xl tracking-tight">错误链路演示</h1>
      <Link className="text-sm underline underline-offset-4" to="/">
        ← 返回首页
      </Link>
    </header>

    <ProbeDemo />
    <SignupDemo />
  </main>
);

export const Route = createFileRoute("/demo")({
  component: Demo,
});

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { errorCatalog } from "@v-monorepo/shared";
import { Button } from "@v-monorepo/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@v-monorepo/ui/components/empty";
import { FileQuestionIcon, OctagonXIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { toErrorView } from "#/lib/error-view.ts";

const HomeLink = () => (
  <Button nativeButton={false} render={<Link to="/" />} variant="outline">
    返回首页
  </Button>
);

const Screen = ({
  description,
  icon,
  title,
  children,
}: {
  description: ReactNode;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) => (
  <Empty className="min-h-screen">
    <EmptyHeader>
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {description === null ? null : (
        <EmptyDescription>{description}</EmptyDescription>
      )}
    </EmptyHeader>
    <EmptyContent>{children}</EmptyContent>
  </Empty>
);

export const ErrorScreen = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const view = toErrorView(error);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <Screen
      description={
        view.traceId === undefined ? null : (
          <>
            报障请提供请求编号 <code className="font-mono">{view.traceId}</code>
          </>
        )
      }
      icon={<OctagonXIcon />}
      title={view.message}
    >
      {import.meta.env.DEV ? (
        <details className="text-muted-foreground w-full text-left text-sm">
          <summary>开发信息</summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
            {error instanceof Error
              ? (error.stack ?? error.message)
              : String(error)}
          </pre>
        </details>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            void router.invalidate();
          }}
        >
          重试
        </Button>
        <HomeLink />
      </div>
    </Screen>
  );
};

export const NotFoundScreen = () => (
  <Screen
    description={errorCatalog.not_found.message}
    icon={<FileQuestionIcon />}
    title="页面不存在"
  >
    <HomeLink />
  </Screen>
);

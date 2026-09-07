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
import { useEffect } from "react";

import { routeErrorView } from "#/lib/route-error.ts";

const HomeLink = () => (
  <Button nativeButton={false} render={<Link to="/" />} variant="outline">
    返回首页
  </Button>
);

export const DefaultErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const view = routeErrorView(error);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <Empty className="min-h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <OctagonXIcon />
        </EmptyMedia>
        <EmptyTitle>{view.title}</EmptyTitle>
        {view.detail === undefined ? null : (
          <EmptyDescription>{view.detail}</EmptyDescription>
        )}
      </EmptyHeader>
      <EmptyContent>
        {import.meta.env.DEV ? (
          <details className="text-muted-foreground w-full text-left text-sm">
            <summary>开发信息</summary>
            <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
              {error.stack ?? error.message}
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
      </EmptyContent>
    </Empty>
  );
};

export const DefaultNotFoundComponent = () => {
  const notFound = errorCatalog.NOT_FOUND;

  return (
    <Empty className="min-h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>{notFound.title}</EmptyTitle>
        <EmptyDescription>{notFound.detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <HomeLink />
      </EmptyContent>
    </Empty>
  );
};

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@v-monorepo/ui/components/empty";
import { Spinner } from "@v-monorepo/ui/components/spinner";

export const PendingFallback = () => (
  <div
    className="flex items-center justify-center py-6"
    aria-busy="true"
    aria-live="polite"
  >
    <Spinner />
  </div>
);

export const DefaultPendingComponent = () => (
  <Empty className="min-h-screen" aria-busy="true" aria-live="polite">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Spinner />
      </EmptyMedia>
      <EmptyTitle>加载中…</EmptyTitle>
    </EmptyHeader>
  </Empty>
);

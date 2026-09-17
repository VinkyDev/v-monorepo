import type { StorageThreadType } from "@mastra/core/memory";

export interface MemoryThreadItem {
  archived: boolean;
  id: string;
  lastMessageAt?: string;
  title?: string;
}

type ThreadMetadata = NonNullable<StorageThreadType["metadata"]>;

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

export const isArchivedThread = (thread: StorageThreadType): boolean =>
  thread.metadata?.archived === true;

export const toMemoryThreadItem = (
  thread: StorageThreadType
): MemoryThreadItem => ({
  archived: isArchivedThread(thread),
  id: thread.id,
  lastMessageAt: toIso(thread.updatedAt),
  title:
    thread.title === undefined || thread.title.length === 0
      ? undefined
      : thread.title,
});

export const archivedMetadata = (
  metadata: ThreadMetadata | undefined,
  archived: boolean
): ThreadMetadata => ({
  ...metadata,
  archived,
});

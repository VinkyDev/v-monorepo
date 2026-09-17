import type { AgUiMessage } from "@assistant-ui/react-ag-ui";
import { fromAgUiMessages, toAgUiMessages } from "@assistant-ui/react-ag-ui";
import { z } from "zod";

export const RESEARCH_THREADS_STORAGE_KEY = "research-agent-threads";
export const RESEARCH_OWNER_STORAGE_KEY = "research-agent-owner";

const SCHEMA_VERSION = 1;

const storedMessageSchema = z.looseObject({
  id: z.string().min(1),
  role: z.enum([
    "assistant",
    "developer",
    "reasoning",
    "system",
    "tool",
    "user",
  ]),
});

const researchThreadSchema = z.object({
  archived: z.boolean(),
  id: z.string().min(1),
  lastMessageAt: z.string().min(1).optional(),
  messages: z.array(storedMessageSchema),
  title: z.string().min(1).optional(),
});

const persistedStateSchema = z.object({
  threadId: z.string().min(1),
  threads: z.array(researchThreadSchema).min(1),
  version: z.literal(SCHEMA_VERSION),
});

export interface ResearchThread {
  archived: boolean;
  id: string;
  lastMessageAt?: string;
  messages: AgUiMessage[];
  title?: string;
}

export interface ResearchThreadState {
  threadId: string;
  threads: ResearchThread[];
}

export interface RemoteThread {
  archived: boolean;
  id: string;
  lastMessageAt?: string;
  title?: string;
}

export interface ThreadStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const toResearchThread = (
  thread: z.infer<typeof researchThreadSchema>
): ResearchThread => ({
  archived: thread.archived,
  id: thread.id,
  lastMessageAt: thread.lastMessageAt,
  messages: toAgUiMessages(fromAgUiMessages(thread.messages)),
  title: thread.title,
});

export const createThreadId = (): string => crypto.randomUUID();

export const emptyThread = (id = createThreadId()): ResearchThread => ({
  archived: false,
  id,
  messages: [],
});

export const createInitialThreadState = (
  id = createThreadId()
): ResearchThreadState => ({
  threadId: id,
  threads: [emptyThread(id)],
});

export const loadOwnerId = (storage: ThreadStorage): string => {
  const existing = storage.getItem(RESEARCH_OWNER_STORAGE_KEY);
  if (existing !== null && existing.length > 0) {
    return existing;
  }
  const id = createThreadId();
  storage.setItem(RESEARCH_OWNER_STORAGE_KEY, id);
  return id;
};

export const loadThreadState = (
  storage: ThreadStorage
): ResearchThreadState => {
  try {
    const raw = storage.getItem(RESEARCH_THREADS_STORAGE_KEY);
    if (raw === null) {
      return createInitialThreadState();
    }
    const parsed = persistedStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return createInitialThreadState();
    }
    const threads = parsed.data.threads.map(toResearchThread);
    const threadId = threads.some(
      (thread) => thread.id === parsed.data.threadId
    )
      ? parsed.data.threadId
      : threads[0].id;
    return { threadId, threads };
  } catch {
    return createInitialThreadState();
  }
};

export const saveThreadState = (
  storage: ThreadStorage,
  state: ResearchThreadState
): void => {
  storage.setItem(
    RESEARCH_THREADS_STORAGE_KEY,
    JSON.stringify({
      threadId: state.threadId,
      threads: state.threads,
      version: SCHEMA_VERSION,
    })
  );
};

const replaceThread = (
  state: ResearchThreadState,
  threadId: string,
  update: (thread: ResearchThread) => ResearchThread
): ResearchThreadState => ({
  ...state,
  threads: state.threads.map((thread) =>
    thread.id === threadId ? update(thread) : thread
  ),
});

export const threadMessages = (
  messages: ResearchThread["messages"]
): ReturnType<typeof fromAgUiMessages> => fromAgUiMessages(messages);

type SnapshotMessages = Parameters<typeof toAgUiMessages>[0];

const userMessageTextSchema = z.object({
  content: z.union([
    z.string(),
    z.array(
      z.looseObject({
        text: z.string(),
        type: z.literal("text"),
      })
    ),
  ]),
  role: z.literal("user"),
});

const attachmentNameSchema = z.object({
  attachments: z.array(z.looseObject({ name: z.string().min(1) })).min(1),
});

export const userTextFromMessages = (
  messages: SnapshotMessages
): string | undefined => {
  for (const message of messages) {
    const parsed = userMessageTextSchema.safeParse(message);
    if (!parsed.success) {
      continue;
    }
    const text = (
      Array.isArray(parsed.data.content)
        ? parsed.data.content.map((part) => part.text).join("")
        : parsed.data.content
    ).trim();
    if (text.length > 0) {
      return text;
    }
  }
  for (const message of messages) {
    const parsed = attachmentNameSchema.safeParse(message);
    if (!parsed.success) {
      continue;
    }
    const name = parsed.data.attachments[0]?.name;
    if (name !== undefined) {
      return name;
    }
  }
  return undefined;
};

const clipTitle = (text: string, max = 40): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const toStoredMessages = (messages: AgUiMessage[]): AgUiMessage[] =>
  toAgUiMessages(
    fromAgUiMessages(researchThreadSchema.shape.messages.parse(messages))
  );

export const appendThreadMessage = (
  state: ResearchThreadState,
  threadId: string,
  message: SnapshotMessages[number]
): ResearchThreadState => {
  const existing = state.threads.find((thread) => thread.id === threadId);
  if (existing === undefined) {
    return state;
  }

  const serialized = toStoredMessages(toAgUiMessages([message]));
  if (serialized.length === 0) {
    return state;
  }

  const nextById = new Map(
    existing.messages.map((item) => [item.id, item] as const)
  );
  for (const item of serialized) {
    nextById.set(item.id, item);
  }
  const seen = new Set<string>();
  const messages: AgUiMessage[] = [];
  for (const item of [...existing.messages, ...serialized]) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    const current = nextById.get(item.id);
    if (current !== undefined) {
      messages.push(current);
    }
  }
  const userText = userTextFromMessages([message]);
  const title =
    existing.title ??
    (userText === undefined ? undefined : clipTitle(userText));

  return replaceThread(state, threadId, (thread) => ({
    ...thread,
    lastMessageAt: new Date().toISOString(),
    messages,
    title,
  }));
};

export const applyRemoteThreads = (
  state: ResearchThreadState,
  remote: readonly RemoteThread[]
): ResearchThreadState => {
  const localById = new Map(
    state.threads.map((thread) => [thread.id, thread] as const)
  );
  const remoteIds = new Set(remote.map((thread) => thread.id));
  const localsOnly = state.threads.filter(
    (thread) => !remoteIds.has(thread.id)
  );
  const merged = remote.map((item) => {
    const local = localById.get(item.id);
    return {
      archived: item.archived,
      id: item.id,
      lastMessageAt: item.lastMessageAt ?? local?.lastMessageAt,
      messages: local?.messages ?? [],
      title:
        item.title === undefined || item.title.length === 0
          ? local?.title
          : item.title,
    };
  });
  const threads = [...localsOnly, ...merged];
  if (threads.length === 0) {
    return createInitialThreadState(state.threadId);
  }
  const threadId = threads.some((thread) => thread.id === state.threadId)
    ? state.threadId
    : threads[0].id;
  return { threadId, threads };
};

export const switchToThread = (
  state: ResearchThreadState,
  threadId: string
): ResearchThreadState => {
  const thread = state.threads.find((item) => item.id === threadId);
  if (thread === undefined) {
    return state;
  }
  return {
    threadId,
    threads: state.threads.map((item) =>
      item.id === threadId ? { ...item, archived: false } : item
    ),
  };
};

export const switchToNewThread = (
  state: ResearchThreadState
): ResearchThreadState => {
  const current = state.threads.find((thread) => thread.id === state.threadId);
  if (
    current !== undefined &&
    !current.archived &&
    current.messages.length === 0 &&
    current.title === undefined
  ) {
    return state;
  }

  const next = emptyThread();
  return {
    threadId: next.id,
    threads: [next, ...state.threads],
  };
};

export const renameThread = (
  state: ResearchThreadState,
  threadId: string,
  title: string
): ResearchThreadState => {
  const next = title.trim();
  if (next.length === 0) {
    return state;
  }
  return replaceThread(state, threadId, (thread) => ({
    ...thread,
    title: next,
  }));
};

const selectAfterRemoval = (
  state: ResearchThreadState,
  removedId: string
): string => {
  if (state.threadId !== removedId) {
    return state.threadId;
  }
  const remaining = state.threads.find(
    (thread) => thread.id !== removedId && !thread.archived
  );
  return remaining?.id ?? createThreadId();
};

export const archiveThread = (
  state: ResearchThreadState,
  threadId: string
): ResearchThreadState => {
  const nextId = selectAfterRemoval(state, threadId);
  const archived = replaceThread(state, threadId, (thread) => ({
    ...thread,
    archived: true,
  }));
  if (archived.threads.some((thread) => thread.id === nextId)) {
    return { ...archived, threadId: nextId };
  }
  const created = emptyThread(nextId);
  return {
    threadId: created.id,
    threads: [created, ...archived.threads],
  };
};

export const unarchiveThread = (
  state: ResearchThreadState,
  threadId: string
): ResearchThreadState =>
  replaceThread(state, threadId, (thread) => ({
    ...thread,
    archived: false,
  }));

export const deleteThread = (
  state: ResearchThreadState,
  threadId: string
): ResearchThreadState => {
  const remaining = state.threads.filter((thread) => thread.id !== threadId);
  if (remaining.length === 0) {
    return createInitialThreadState();
  }
  const nextId = selectAfterRemoval({ ...state, threads: remaining }, threadId);
  if (remaining.some((thread) => thread.id === nextId)) {
    return { threadId: nextId, threads: remaining };
  }
  const created = emptyThread(nextId);
  return { threadId: created.id, threads: [created, ...remaining] };
};

export const messagesForThread = (
  state: ResearchThreadState,
  threadId: string
): ReturnType<typeof fromAgUiMessages> =>
  threadMessages(
    state.threads.find((thread) => thread.id === threadId)?.messages ?? []
  );

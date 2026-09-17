import { describe, expect, test } from "vite-plus/test";

import {
  RESEARCH_OWNER_STORAGE_KEY,
  RESEARCH_THREADS_STORAGE_KEY,
  appendThreadMessage,
  applyRemoteThreads,
  archiveThread,
  createInitialThreadState,
  deleteThread,
  loadOwnerId,
  loadThreadState,
  renameThread,
  saveThreadState,
  switchToNewThread,
  switchToThread,
  unarchiveThread,
} from "#/lib/research-threads.ts";
import type { ThreadStorage } from "#/lib/research-threads.ts";

const memoryStorage = (): ThreadStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
};

const userMessage = (id: string, text: string) => ({
  content: [{ text, type: "text" as const }],
  id,
  role: "user" as const,
});

describe("research thread state", () => {
  test("reuses an empty current thread instead of stacking blanks", () => {
    const initial = createInitialThreadState("thread-1");
    expect(switchToNewThread(initial).threadId).toBe("thread-1");
  });

  test("creates a new thread after a conversation exists", () => {
    const withMessages = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      userMessage("m1", "AG-UI 是什么")
    );
    const next = switchToNewThread(withMessages);
    expect(next.threadId).not.toBe("thread-1");
    expect(next.threads).toHaveLength(2);
    expect(next.threads.find((thread) => thread.id === "thread-1")?.title).toBe(
      "AG-UI 是什么"
    );
  });

  test("keeps tool results when appending an assistant message", () => {
    const withUser = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      userMessage("m1", "Mastra")
    );
    const withTool = appendThreadMessage(withUser, "thread-1", {
      content: [
        {
          args: { query: "Mastra AI framework" },
          argsText: '{"query":"Mastra AI framework"}',
          result: { hits: 1 },
          toolCallId: "call-1",
          toolName: "wikipedia_search",
          type: "tool-call",
        },
      ],
      id: "a1",
      role: "assistant",
    });
    expect(
      withTool.threads[0]?.messages.some((message) => message.role === "tool")
    ).toBeTruthy();
  });

  test("upserts a message by id without wiping siblings", () => {
    const first = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      userMessage("m1", "keep me")
    );
    const updated = appendThreadMessage(
      first,
      "thread-1",
      userMessage("m1", "keep me")
    );
    expect(updated.threads[0]?.messages).toHaveLength(1);
  });

  test("rename, archive, restore, and delete keep a current thread", () => {
    const first = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      userMessage("m1", "first")
    );
    const second = switchToNewThread(first);
    const named = renameThread(second, second.threadId, "  规划  ");
    const currentId = named.threadId;
    const archived = archiveThread(named, currentId);
    expect(archived.threadId).toBe("thread-1");
    expect(
      archived.threads.find((thread) => thread.id === currentId)?.archived
    ).toBeTruthy();

    const restored = unarchiveThread(archived, currentId);
    expect(
      restored.threads.find((thread) => thread.id === currentId)?.archived
    ).toBeFalsy();

    const removed = deleteThread(restored, "thread-1");
    expect(
      removed.threads.some((thread) => thread.id === "thread-1")
    ).toBeFalsy();
    expect(removed.threadId).toBe(currentId);
  });

  test("round-trips through storage and reuses a stable owner id", () => {
    const storage = memoryStorage();
    const owner = loadOwnerId(storage);
    expect(loadOwnerId(storage)).toBe(owner);
    expect(storage.data.has(RESEARCH_OWNER_STORAGE_KEY)).toBeTruthy();

    const state = renameThread(
      appendThreadMessage(
        createInitialThreadState("thread-1"),
        "thread-1",
        userMessage("m1", "persist")
      ),
      "thread-1",
      "saved"
    );
    saveThreadState(storage, state);
    expect(storage.data.has(RESEARCH_THREADS_STORAGE_KEY)).toBeTruthy();
    expect(loadThreadState(storage)).toStrictEqual(state);
  });

  test("falls back when storage is empty or corrupt", () => {
    const storage = memoryStorage();
    const empty = loadThreadState(storage);
    expect(empty.threads).toHaveLength(1);

    storage.setItem(RESEARCH_THREADS_STORAGE_KEY, "{not json");
    const recovered = loadThreadState(storage);
    expect(recovered.threads).toHaveLength(1);
    expect(recovered.threadId).not.toBe(empty.threadId);
  });

  test("switchToThread ignores unknown ids", () => {
    const initial = createInitialThreadState("thread-1");
    expect(switchToThread(initial, "missing").threadId).toBe("thread-1");
  });

  test("applies remote metadata without dropping local transcripts", () => {
    const local = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      userMessage("m1", "keep me")
    );
    const next = applyRemoteThreads(local, [
      {
        archived: true,
        id: "thread-1",
        lastMessageAt: "2026-09-17T00:00:00.000Z",
        title: "generated",
      },
      { archived: false, id: "thread-2", title: "other" },
    ]);
    expect(
      next.threads.find((thread) => thread.id === "thread-1")?.messages
    ).toHaveLength(1);
    expect(next.threads.find((thread) => thread.id === "thread-1")?.title).toBe(
      "generated"
    );
    expect(
      next.threads.find((thread) => thread.id === "thread-1")?.archived
    ).toBeTruthy();
    expect(
      next.threads.some((thread) => thread.id === "thread-2")
    ).toBeTruthy();
  });

  test("keeps image attachments when appending a user message", () => {
    const next = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      {
        attachments: [
          {
            content: [
              {
                image: "data:image/png;base64,abc",
                type: "image" as const,
              },
            ],
            contentType: "image/png",
            name: "shot.png",
          },
        ],
        content: [{ text: "这是什么", type: "text" as const }],
        id: "m1",
        role: "user" as const,
      }
    );
    const stored = next.threads[0]?.messages[0];
    expect(stored?.role).toBe("user");
    expect(JSON.stringify(stored)).toContain("image");
    expect(next.threads[0]?.title).toBe("这是什么");
  });

  test("titles a file-only user message from the attachment name", () => {
    const next = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      {
        attachments: [
          {
            content: [
              {
                data: "data:application/pdf;base64,abc",
                filename: "brief.pdf",
                mimeType: "application/pdf",
                type: "file" as const,
              },
            ],
            contentType: "application/pdf",
            name: "brief.pdf",
          },
        ],
        content: [],
        id: "m1",
        role: "user" as const,
      }
    );
    expect(next.threads[0]?.title).toBe("brief.pdf");
    expect(JSON.stringify(next.threads[0]?.messages[0])).toContain("document");
  });

  test("reload keeps a text file as a document attachment", () => {
    const storage = memoryStorage();
    const state = appendThreadMessage(
      createInitialThreadState("thread-1"),
      "thread-1",
      {
        attachments: [
          {
            content: [
              {
                data: "data:text/plain;base64,aGVsbG8gcmlzZWFyY2g=",
                filename: "note.txt",
                mimeType: "text/plain",
                type: "file" as const,
              },
            ],
            contentType: "text/plain",
            name: "note.txt",
          },
        ],
        content: [{ text: "读一下这个附件里的文字", type: "text" as const }],
        id: "m1",
        role: "user" as const,
      }
    );
    saveThreadState(storage, state);
    const loaded = loadThreadState(storage);
    const stored = JSON.stringify(loaded.threads[0]?.messages[0]);
    expect(stored).toContain("document");
    expect(stored).toContain("note.txt");
    expect(stored).not.toContain("<attachment");
  });
});

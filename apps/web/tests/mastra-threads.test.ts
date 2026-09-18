import type { ThreadMessage } from "@assistant-ui/react";
import { describe, expect, test } from "vite-plus/test";

import {
  RESEARCH_OWNER_STORAGE_KEY,
  archiveThreadUpdate,
  isArchivedMetadata,
  loadOwnerId,
  titleFromMessages,
  toRemoteThreadMetadata,
  withArchivedMetadata,
} from "#/lib/mastra-threads.ts";
import type { OwnerStorage } from "#/lib/mastra-threads.ts";

const memoryStorage = (): OwnerStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
};

const thread = (patch?: {
  metadata?: { archived?: boolean; topic?: string };
  title?: string;
}) => ({
  id: "thread-1",
  metadata: { topic: "research", ...patch?.metadata },
  resourceId: "owner-1",
  title: patch?.title ?? "Mastra Memory 是什么",
  updatedAt: new Date("2026-09-17T00:00:00.000Z"),
});

const userMessage = (text: string, attachmentName?: string): ThreadMessage => ({
  attachments:
    attachmentName === undefined
      ? []
      : [
          {
            content: [],
            contentType: "text/plain",
            id: "att-1",
            name: attachmentName,
            status: { type: "complete" },
            type: "document",
          },
        ],
  content: text.length > 0 ? [{ text, type: "text" }] : [],
  createdAt: new Date("2026-09-17T00:00:00.000Z"),
  id: "m1",
  metadata: { custom: {} },
  role: "user",
});

describe("owner id", () => {
  test("reuses a stable localStorage owner id", () => {
    const storage = memoryStorage();
    const owner = loadOwnerId(storage);
    expect(loadOwnerId(storage)).toBe(owner);
    expect(storage.data.get(RESEARCH_OWNER_STORAGE_KEY)).toBe(owner);
  });
});

describe("archive metadata", () => {
  test("maps Mastra metadata.archived onto thread status", () => {
    expect(isArchivedMetadata()).toBeFalsy();
    expect(toRemoteThreadMetadata(thread()).status).toBe("regular");
    expect(
      toRemoteThreadMetadata(
        thread({ metadata: { archived: true, topic: "research" } })
      )
    ).toMatchObject({
      remoteId: "thread-1",
      status: "archived",
      title: "Mastra Memory 是什么",
    });
  });

  test("archive updates keep title and other metadata", () => {
    expect(withArchivedMetadata({ archived: false }, true)).toStrictEqual({
      archived: true,
    });
    expect(archiveThreadUpdate(thread(), true)).toStrictEqual({
      metadata: { archived: true, topic: "research" },
      resourceId: "owner-1",
      title: "Mastra Memory 是什么",
    });
    expect(
      archiveThreadUpdate(
        thread({ metadata: { archived: true } }),
        false,
        "新标题"
      )
    ).toStrictEqual({
      metadata: { archived: false, topic: "research" },
      resourceId: "owner-1",
      title: "新标题",
    });
  });
});

describe(titleFromMessages, () => {
  test("clips the first user text", () => {
    expect(
      titleFromMessages([userMessage("用维基百科解释 Mastra Memory")])
    ).toBe("用维基百科解释 Mastra Memory");
  });

  test("falls back to an attachment name", () => {
    expect(titleFromMessages([userMessage("", "brief.txt")])).toBe("brief.txt");
  });
});

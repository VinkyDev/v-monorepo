import { describe, expect, test } from "vite-plus/test";

import {
  archivedMetadata,
  isArchivedThread,
  toMemoryThreadItem,
} from "#/mastra/memory-threads.ts";
import { RESOURCE_ID_HEADER, readResourceId } from "#/mastra/resource-id.ts";

describe(readResourceId, () => {
  test("reads the owner header", () => {
    const request = new Request("http://localhost/agui/research-agent", {
      headers: { [RESOURCE_ID_HEADER]: "owner-1" },
    });
    expect(readResourceId(request)).toBe("owner-1");
  });

  test("rejects a missing header", () => {
    expect(
      readResourceId(new Request("http://localhost/agui/research-agent"))
    ).toBeUndefined();
  });
});

describe(toMemoryThreadItem, () => {
  test("maps Mastra thread metadata", () => {
    const item = toMemoryThreadItem({
      createdAt: new Date("2026-09-17T00:00:00.000Z"),
      id: "thread-1",
      metadata: { archived: true },
      resourceId: "owner-1",
      title: "AG-UI 是什么",
      updatedAt: new Date("2026-09-17T01:00:00.000Z"),
    });
    expect(item).toStrictEqual({
      archived: true,
      id: "thread-1",
      lastMessageAt: "2026-09-17T01:00:00.000Z",
      title: "AG-UI 是什么",
    });
    expect(
      isArchivedThread({
        createdAt: new Date(),
        id: "thread-2",
        resourceId: "owner-1",
        updatedAt: new Date(),
      })
    ).toBeFalsy();
    expect(archivedMetadata({ topic: "x" }, true)).toStrictEqual({
      archived: true,
      topic: "x",
    });
  });
});

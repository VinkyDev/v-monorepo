import { describe, expect, test } from "vite-plus/test";

import { messageIdsAfter } from "#/features/chat/mastra.ts";

const messages = ["u1", "a1", "u2", "a2"].map((id) => ({ id }));

describe(messageIdsAfter, () => {
  test("returns the persisted suffix after the retained conversation", () => {
    expect(messageIdsAfter(messages, "u2")).toStrictEqual(["a2"]);
    expect(messageIdsAfter(messages, "a1")).toStrictEqual(["u2", "a2"]);
  });

  test("returns every message for an empty retained conversation", () => {
    expect(messageIdsAfter(messages)).toStrictEqual(["u1", "a1", "u2", "a2"]);
  });

  test("rejects a retained message that is not in persisted history", () => {
    expect(() => messageIdsAfter(messages, "missing")).toThrow(
      "Message missing is missing from Mastra memory"
    );
  });
});

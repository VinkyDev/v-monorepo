import { describe, expect, test } from "vite-plus/test";

import { documentAttachmentAdapter } from "#/lib/research-attachments.ts";

describe("document attachments", () => {
  test("turns a PDF into a file content part", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "brief.pdf", {
      type: "application/pdf",
    });
    const pending = await documentAttachmentAdapter.add({ file });
    const complete = await documentAttachmentAdapter.send(pending);
    expect(complete.status.type).toBe("complete");
    const [part] = complete.content;
    expect(part).toMatchObject({
      filename: "brief.pdf",
      mimeType: "application/pdf",
      type: "file",
    });
    expect(
      part?.type === "file" &&
        part.data.startsWith("data:application/pdf;base64,")
    ).toBeTruthy();
  });

  test("turns a text file into a file content part", async () => {
    const file = new File(["hello research"], "note.txt", {
      type: "text/plain",
    });
    const pending = await documentAttachmentAdapter.add({ file });
    const complete = await documentAttachmentAdapter.send(pending);
    const [part] = complete.content;
    expect(part).toMatchObject({
      filename: "note.txt",
      mimeType: "text/plain",
      type: "file",
    });
    expect(
      part?.type === "file" && part.data.startsWith("data:text/plain;base64,")
    ).toBeTruthy();
    expect(
      part?.type === "file"
        ? atob(part.data.slice("data:text/plain;base64,".length))
        : undefined
    ).toBe("hello research");
  });

  test("rejects documents larger than 10MB", async () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "huge.pdf", {
      type: "application/pdf",
    });
    await expect(documentAttachmentAdapter.add({ file })).rejects.toThrow(
      "文件超过 10MB 限制"
    );
  });
});

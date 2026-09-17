import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
} from "@assistant-ui/react";
import type {
  AttachmentAdapter,
  CompleteAttachment,
  PendingAttachment,
} from "@assistant-ui/react";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const mimeTypeOf = (file: File): string =>
  file.type.length > 0 ? file.type : "application/octet-stream";

const bytesToDataUrl = (bytes: Uint8Array, mimeType: string): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
};

const pendingDocument = (file: File): PendingAttachment => ({
  contentType: mimeTypeOf(file),
  file,
  id: crypto.randomUUID(),
  name: file.name,
  status: { reason: "composer-send", type: "requires-action" },
  type: "document",
});

const addDocument = async ({
  file,
}: {
  file: File;
}): Promise<PendingAttachment> => {
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error("文件超过 10MB 限制");
  }
  return pendingDocument(file);
};

const sendDocument = async (
  attachment: PendingAttachment
): Promise<CompleteAttachment> => {
  const { file } = attachment;
  if (file === undefined) {
    throw new Error("missing attachment file");
  }
  const mimeType = mimeTypeOf(file);
  return {
    ...attachment,
    content: [
      {
        data: bytesToDataUrl(
          new Uint8Array(await file.arrayBuffer()),
          mimeType
        ),
        filename: attachment.name,
        mimeType,
        type: "file",
      },
    ],
    status: { type: "complete" },
  };
};

export const documentAttachmentAdapter = {
  accept: "text/*,application/json,application/pdf,.txt,.md,.csv,.json,.pdf",
  add: addDocument,
  remove: async () => Promise.resolve(),
  send: sendDocument,
} satisfies AttachmentAdapter;

export const researchAttachments = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  documentAttachmentAdapter,
]);

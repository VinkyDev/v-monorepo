"use client";

import { useAuiState } from "@assistant-ui/react";
import { useEffect, useState } from "react";

const useFileSrc = (file: File | undefined) => {
  const [entry, setEntry] = useState<{ file: File; url: string } | undefined>(
    undefined
  );

  useEffect(() => {
    // The object URL is a browser resource whose lifetime has to straddle
    // commit, so allocation, revocation, and clearing the entry that names a
    // revoked URL all belong to the effect.
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntry(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setEntry({ file, url: objectUrl });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return entry !== undefined && entry.file === file ? entry.url : undefined;
};

export const useAttachmentSrc = () => {
  const file = useAuiState((s) =>
    s.attachment.type === "image" ? s.attachment.file : undefined
  );
  const imageSrc = useAuiState((s) => {
    if (s.attachment.type !== "image" || s.attachment.file) {
      return undefined;
    }
    return s.attachment.content?.find((part) => part.type === "image")?.image;
  });

  return useFileSrc(file) ?? imageSrc;
};

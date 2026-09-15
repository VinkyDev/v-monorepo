import { isDesktop, shellApi } from "@v-monorepo/electron";
import { logger, toError } from "@v-monorepo/logger";
import { Button } from "@v-monorepo/ui/components/button";
import { toast } from "@v-monorepo/ui/components/toast";
import { useEffect, useState } from "react";

import { toErrorView } from "#/lib/error-view.ts";

/**
 * Shell calls sit outside React Query, so they report and surface here instead
 * of leaving an unhandled rejection behind.
 */
const reportShellFailure = (capability: string, cause: unknown): void => {
  const error = toError(cause);
  logger.error({
    error,
    event: "shell_call_failed",
    message: error.message,
    meta: { capability },
  });
  toast.add({
    priority: "high",
    title: toErrorView(cause).message,
    type: "error",
  });
};

const ElectronVersionDemo = () => {
  const [version, setVersion] = useState<string | undefined>();

  useEffect(() => {
    const loadVersion = async (): Promise<void> => {
      try {
        setVersion(await shellApi().getElectronVersion());
      } catch (error) {
        reportShellFailure("getElectronVersion", error);
      }
    };
    void loadVersion();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().getElectronVersion()</code>
      </p>
      <p className="font-mono text-sm">{version ?? "读取中…"}</p>
    </div>
  );
};

const OpenExternalDemo = () => {
  const [busy, setBusy] = useState(false);

  const openGuide = async (): Promise<void> => {
    setBusy(true);
    try {
      await shellApi().openExternal("https://viteplus.dev/guide/");
    } catch (error) {
      reportShellFailure("openExternal", error);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().openExternal()</code>
      </p>
      <Button
        onClick={() => {
          void openGuide();
        }}
        disabled={busy}
      >
        在系统浏览器打开 Vite+ 文档
      </Button>
    </div>
  );
};

const ClipboardDemo = () => {
  const [draft, setDraft] = useState("hello from desktop");
  const [copied, setCopied] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const writeDraft = async (): Promise<void> => {
    setBusy(true);
    try {
      await shellApi().writeClipboardText(draft);
      setCopied(draft);
    } catch (error) {
      reportShellFailure("writeClipboardText", error);
    }
    setBusy(false);
  };

  const readClipboard = async (): Promise<void> => {
    setBusy(true);
    try {
      setCopied(await shellApi().readClipboardText());
    } catch (error) {
      reportShellFailure("readClipboardText", error);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().writeClipboardText</code> /{" "}
        <code>shellApi().readClipboardText</code>
      </p>
      <textarea
        className="border-border bg-background focus-visible:border-ring focus-visible:ring-ring/30 min-h-24 resize-y rounded-md border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            void writeDraft();
          }}
          disabled={busy}
        >
          写入剪切板
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void readClipboard();
          }}
          disabled={busy}
        >
          读取剪切板
        </Button>
      </div>
      {copied === undefined ? null : (
        <p className="text-muted-foreground font-mono text-sm break-all">
          当前剪切板：{copied}
        </p>
      )}
    </div>
  );
};

const DesktopDemo = () => {
  if (!isDesktop()) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        Desktop · 壳能力
      </h2>
      <div className="border-border bg-card flex flex-col gap-6 rounded-lg border p-6">
        <ElectronVersionDemo />
        <OpenExternalDemo />
        <ClipboardDemo />
      </div>
    </section>
  );
};

export default DesktopDemo;

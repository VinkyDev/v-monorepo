import { isDesktop, shellApi } from "@v-monorepo/utils";
import { Button } from "@v-monorepo/ui/components/button";
import { useEffect, useState } from "react";

export function DesktopDemo() {
  if (!isDesktop()) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-widest">
        Desktop · 壳能力
      </h2>
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
        <ElectronVersionDemo />
        <OpenExternalDemo />
        <ClipboardDemo />
      </div>
    </section>
  );
}

function ElectronVersionDemo() {
  const [version, setVersion] = useState<string | undefined>();

  useEffect(() => {
    void shellApi().getElectronVersion().then(setVersion);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().getElectronVersion()</code>
      </p>
      <p className="font-mono text-sm">{version ?? "读取中…"}</p>
    </div>
  );
}

function OpenExternalDemo() {
  const [busy, setBusy] = useState(false);

  async function openGuide(): Promise<void> {
    setBusy(true);
    try {
      await shellApi().openExternal("https://viteplus.dev/guide/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().openExternal()</code>
      </p>
      <Button onClick={() => void openGuide()} disabled={busy}>
        在系统浏览器打开 Vite+ 文档
      </Button>
    </div>
  );
}

function ClipboardDemo() {
  const [draft, setDraft] = useState("hello from desktop");
  const [copied, setCopied] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function writeDraft(): Promise<void> {
    setBusy(true);
    try {
      await shellApi().writeClipboardText(draft);
      setCopied(draft);
    } finally {
      setBusy(false);
    }
  }

  async function readClipboard(): Promise<void> {
    setBusy(true);
    try {
      setCopied(await shellApi().readClipboardText());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <code>shellApi().writeClipboardText</code> / <code>shellApi().readClipboardText</code>
      </p>
      <textarea
        className="min-h-24 resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void writeDraft()} disabled={busy}>
          写入剪切板
        </Button>
        <Button variant="outline" onClick={() => void readClipboard()} disabled={busy}>
          读取剪切板
        </Button>
      </div>
      {copied !== undefined ? (
        <p className="break-all font-mono text-muted-foreground text-sm">当前剪切板：{copied}</p>
      ) : null}
    </div>
  );
}

"use client";

import {
  MessagePrimitive,
  useAuiState,
  type AssistantState,
  type ToolCallMessagePartStatus,
} from "@assistant-ui/react";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@v-monorepo/ui/components/collapsible";
import { cn } from "cn";
import { ChevronDownIcon, GlobeIcon } from "lucide-react";
import { type FC } from "react";

import {
  extractDomain,
  Source,
  SourceIcon,
  SourceTitle,
} from "#/components/assistant-ui/elements/sources.aui.tsx";
import {
  collapsePanel,
  metaChevron,
  metaIcon,
  metaTrigger,
  ShimmerLabel,
} from "#/components/assistant-ui/elements/surfaces.tsx";
import { ToolGroupRoot } from "#/components/assistant-ui/elements/tool-group.aui.tsx";

const WEB_FETCH_TOOL_NAMES = new Set(["webFetchTool", "web_fetch"]);

const URL_IN_TEXT = /https?:\/\/[^\s"'<>]+/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordString = (value: Record<string, unknown>, key: string) => {
  const field = value[key];
  return typeof field === "string" && field.length > 0 ? field : undefined;
};

const fetchUrlFromArgs = (args: unknown, argsText = "") => {
  if (isRecord(args)) {
    const url = recordString(args, "url") ?? recordString(args, "href");
    if (url) return url;
  }
  return argsText.match(URL_IN_TEXT)?.[0];
};

const fetchUrlFromPart = (
  part: AssistantState["message"]["parts"][number] | undefined
) => {
  if (part?.type !== "tool-call") return undefined;
  return fetchUrlFromArgs(part.args, part.argsText);
};

const urlsKeyFromParts = (
  parts: AssistantState["message"]["parts"],
  indices: readonly number[]
) => {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const index of indices) {
    const url = fetchUrlFromPart(parts[index]);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls.join("\n");
};

const siteCountLabel = (count: number, running: boolean) => {
  if (running) {
    return count > 0 ? `正在搜索 ${count} 个网站` : "正在搜索网站";
  }
  return `已搜索 ${count} 个网站`;
};

export const isWebFetchTool = (toolName: string) =>
  WEB_FETCH_TOOL_NAMES.has(toolName);

export const webFetchUrlFromArgs = fetchUrlFromArgs;

const WebFetchSites: FC<{
  urls: readonly string[];
  running: boolean;
  fallbackCount?: number;
}> = ({ urls, running, fallbackCount = 0 }) => {
  const count = urls.length > 0 ? urls.length : fallbackCount;

  return (
    <ToolGroupRoot variant="ghost">
      <CollapsibleTrigger
        data-slot="web-fetch-trigger"
        className={cn("aui-web-fetch-trigger group/trigger", metaTrigger)}
      >
        <GlobeIcon
          data-slot="web-fetch-trigger-icon"
          aria-hidden
          className={cn("aui-web-fetch-trigger-icon", metaIcon)}
        />
        <ShimmerLabel
          data-slot="web-fetch-trigger-label"
          active={running}
          className="aui-web-fetch-trigger-label-wrapper"
        >
          {siteCountLabel(count, running)}
        </ShimmerLabel>
        <ChevronDownIcon
          data-slot="web-fetch-trigger-chevron"
          className={cn("aui-web-fetch-trigger-chevron", metaChevron)}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        data-slot="web-fetch-content"
        className={cn(
          "aui-web-fetch-content relative outline-none",
          "group/collapsible-content",
          collapsePanel,
          "data-closed:pointer-events-none"
        )}
      >
        {urls.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1.5 pb-0.5">
            {urls.map((url) => (
              <Source
                key={url}
                href={url}
                variant="muted"
                size="sm"
                className="rounded-full"
              >
                <SourceIcon url={url} />
                <SourceTitle>{extractDomain(url)}</SourceTitle>
              </Source>
            ))}
          </div>
        ) : null}
      </CollapsibleContent>
    </ToolGroupRoot>
  );
};

export const WebFetchGroup: FC<{
  part: MessagePrimitive.GroupedParts.GroupPart;
}> = ({ part }) => {
  const urlsKey = useAuiState((s) =>
    urlsKeyFromParts(s.message.parts, part.indices)
  );
  const urls = urlsKey.length > 0 ? urlsKey.split("\n") : [];

  return (
    <WebFetchSites
      urls={urls}
      running={part.status.type === "running"}
      fallbackCount={part.indices.length}
    />
  );
};

export const WebFetchCall: FC<{
  args: unknown;
  argsText?: string;
  status: ToolCallMessagePartStatus;
}> = ({ args, argsText, status }) => {
  const url = fetchUrlFromArgs(args, argsText);
  return (
    <WebFetchSites
      urls={url ? [url] : []}
      running={status.type === "running"}
      fallbackCount={1}
    />
  );
};

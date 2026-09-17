import { EventType, RunAgentInputSchema } from "@ag-ui/core";
import type { BaseEvent } from "@ag-ui/core";
import { describe, expect, test } from "vite-plus/test";
import { z } from "zod";

import { createAguiSseResponse, tryGetAgentById } from "#/mastra/agui.ts";

const input = RunAgentInputSchema.parse({
  context: [],
  messages: [],
  runId: "run-1",
  state: {},
  threadId: "thread-1",
  tools: [],
});

const readSse = async (response: Response): Promise<string> =>
  new TextDecoder().decode(await response.arrayBuffer());

const missingAgent = (_agentId: string): string => {
  throw new Error("Agent not found");
};

describe(tryGetAgentById, () => {
  test("returns undefined when the agent id is missing", () => {
    expect(tryGetAgentById(missingAgent, "missing-agent")).toBeUndefined();
  });
});

describe(createAguiSseResponse, () => {
  test("streams AG-UI events as SSE", async () => {
    const events: BaseEvent[] = [
      {
        runId: "run-1",
        threadId: "thread-1",
        type: EventType.RUN_STARTED,
      },
      {
        runId: "run-1",
        threadId: "thread-1",
        type: EventType.RUN_FINISHED,
      },
    ];

    const response = createAguiSseResponse(
      {
        abortRun: () => {},
        run: () => ({
          subscribe: (observer) => {
            for (const event of events) {
              observer.next(event);
            }
            observer.complete();
            return { unsubscribe: () => {} };
          },
        }),
      },
      input,
      new Request("http://localhost/agui/research-agent", { method: "POST" })
    );

    expect(response.headers.get("Content-Type")).toMatch(/text\/event-stream/u);
    const body = await readSse(response);
    expect(body).toContain('"type":"RUN_STARTED"');
    expect(body).toContain('"type":"RUN_FINISHED"');
  });

  test("emits RUN_ERROR when the observable fails", async () => {
    const response = createAguiSseResponse(
      {
        abortRun: () => {},
        run: () => ({
          subscribe: (observer) => {
            observer.error(new Error("tool exploded"));
            return { unsubscribe: () => {} };
          },
        }),
      },
      input,
      new Request("http://localhost/agui/research-agent", { method: "POST" })
    );

    const body = await readSse(response);
    expect(body).toContain('"type":"RUN_ERROR"');
    expect(body).toContain("tool exploded");
  });
});

describe("RunAgentInputSchema multimodal content", () => {
  test("keeps multimodal user image content", () => {
    const parsed = RunAgentInputSchema.parse({
      context: [],
      messages: [
        {
          content: [
            { text: "这是什么", type: "text" },
            {
              source: { mimeType: "image/png", type: "data", value: "abc" },
              type: "image",
            },
          ],
          id: "m1",
          role: "user",
        },
      ],
      runId: "run-1",
      state: {},
      threadId: "thread-1",
      tools: [],
    });
    const content = parsed.messages[0]?.content;
    const imageParts = z
      .array(z.looseObject({ type: z.literal("image") }))
      .safeParse(content);
    expect(imageParts.success && imageParts.data.length > 0).toBeTruthy();
  });
});

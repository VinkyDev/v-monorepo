import { EventType, RunAgentInputSchema } from "@ag-ui/core";
import type { BaseEvent, RunAgentInput } from "@ag-ui/core";
import { EventEncoder } from "@ag-ui/encoder";
import { MastraAgent } from "@ag-ui/mastra";
import { registerApiRoute } from "@mastra/core/server";

import { publicCors, readResourceId } from "./resource-id.ts";

interface AguiRun {
  abortRun: () => void;
  run: (input: RunAgentInput) => {
    subscribe: (observer: {
      complete: () => void;
      error: (cause: unknown) => void;
      next: (event: BaseEvent) => void;
    }) => { unsubscribe: () => void };
  };
}

const errorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : "agent run failed";

export const tryGetAgentById = <TAgent>(
  getAgentById: (agentId: string) => TAgent,
  agentId: string
): TAgent | undefined => {
  try {
    return getAgentById(agentId);
  } catch {
    return undefined;
  }
};

export const createAguiSseResponse = (
  agent: AguiRun,
  input: RunAgentInput,
  request: Request
): Response => {
  const encoder = new EventEncoder({
    accept: request.headers.get("accept") ?? undefined,
  });
  const bytes = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = (): void => {
        if (closed) {
          return;
        }
        closed = true;
        controller.close();
      };
      const send = (event: BaseEvent): void => {
        if (closed) {
          return;
        }
        controller.enqueue(bytes.encode(encoder.encode(event)));
      };

      const subscription = agent.run(input).subscribe({
        complete: close,
        error: (cause) => {
          send({
            message: errorMessage(cause),
            type: EventType.RUN_ERROR,
          });
          close();
        },
        next: send,
      });

      request.signal.addEventListener(
        "abort",
        () => {
          subscription.unsubscribe();
          agent.abortRun();
          close();
        },
        { once: true }
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": encoder.getContentType(),
      "X-Accel-Buffering": "no",
    },
  });
};

export const aguiRoute = registerApiRoute("/agui/:agentId", {
  cors: publicCors,
  handler: async (context) => {
    const agentId = context.req.param("agentId");
    const mastra = context.get("mastra");
    const agent = tryGetAgentById((id) => mastra.getAgentById(id), agentId);
    if (agent === undefined) {
      return context.json({ error: `Agent ${agentId} not found` }, 404);
    }

    const resourceId = readResourceId(context.req.raw);
    if (resourceId === undefined) {
      return context.json({ error: "missing resource id" }, 400);
    }

    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "invalid AG-UI run input" }, 400);
    }

    const parsed = RunAgentInputSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({ error: "invalid AG-UI run input" }, 400);
    }

    const input = parsed.data;
    const aguiAgent = new MastraAgent({
      agent,
      agentId,
      resourceId,
      streamServerToolCalls: true,
    });

    return createAguiSseResponse(aguiAgent, input, context.req.raw);
  },
  method: "POST",
});

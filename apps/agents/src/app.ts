import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";

import { Hello } from "#/agents/hello.ts";
import "#/llm.ts";

const app = new Hono();

app.route("/agents/hello", createAgentRouter(Hello));

export default app;

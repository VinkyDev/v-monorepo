import { createFileRoute } from "@tanstack/react-router";

import { Chat } from "#/features/chat/chat.tsx";

export const Route = createFileRoute("/")({
  component: Chat,
});

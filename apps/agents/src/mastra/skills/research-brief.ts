import { createSkill } from "@mastra/core/skills";

export const researchBriefSkill = createSkill({
  description:
    "Use when answering a question with live sources: search, read, then write a cited brief.",
  instructions: `You research with live tools. Do not rely on prior knowledge when a tool can check.

## Procedure
1. Load this skill, then pick a source.
   - Established topics (people, history, concepts): Wikipedia MCP first.
   - A known URL, or a Wikipedia hit that needs the live page: web_fetch.
2. Read the best 1–3 pages. Do not stop at titles.
3. Write a short brief. Follow references/brief-format.md.
4. If a tool fails or sources conflict, say so. Never invent a URL, quote, or date.

## Tool use
- Wikipedia MCP for encyclopedia search and article reads.
- web_fetch for a specific public URL.
- Prefer official pages over aggregators when both appear.`,
  name: "research-brief",
  references: {
    "brief-format.md": `# Brief format

- **Answer** — 2–6 sentences. Lead with the fact.
- **Evidence** — what the sources actually say. Quote sparingly.
- **Sources** — title + URL for every claim you relied on.
- **Unknowns** — what you could not verify.

Keep it short. Match the user's language.
`,
  },
});

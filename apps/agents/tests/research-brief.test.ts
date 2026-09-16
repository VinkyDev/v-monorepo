import { describe, expect, test } from "vite-plus/test";

import { researchBriefSkill } from "#/mastra/skills/research-brief.ts";

describe("research-brief", () => {
  test("is discoverable by name", () => {
    expect(researchBriefSkill.name).toBe("research-brief");
    expect(researchBriefSkill.description.length).toBeGreaterThan(0);
  });

  test("bundles the brief format reference", () => {
    expect(researchBriefSkill.references).toContain("brief-format.md");
    expect(researchBriefSkill.__referenceContents["brief-format.md"]).toContain(
      "Sources"
    );
  });
});
